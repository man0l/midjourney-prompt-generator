-- Anonymous free tier:
--   Visitors can generate without signing in (Supabase anonymous sign-ins).
--   1. Anonymous users start with 3 credits; regular signups keep their 5.
--   2. The Resend signup webhook skips anonymous users (no email yet) and
--      fires when they upgrade to a real account instead.
--   3. Upgrading an anonymous account (linking Google/Discord) grants a
--      one-time bonus of +7 credits, topped up to at least 10 total.
--   4. New refund_credit(p_user_id) RPC so /api/optimize can reserve a credit
--      before calling OpenAI and give it back if generation fails.

-- ---------------------------------------------------------------------------
-- 1. Provisioning: anonymous users start with 3, everyone else keeps 5
-- ---------------------------------------------------------------------------
create or replace function public.initialize_user_credits()
returns trigger as $$
begin
  insert into public.user_credits (user_id, credits_remaining, last_reset)
  values (
    new.id,
    case when new.is_anonymous then 3 else 5 end,
    current_date
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function initialize_user_credits();

-- ---------------------------------------------------------------------------
-- 2. Resend webhook: shared sender + guard against anonymous users
-- ---------------------------------------------------------------------------
create or replace function public.send_resend_signup_webhook(p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  webhook_secret text;
begin
  if p_email is null then
    return;
  end if;

  select decrypted_secret into webhook_secret
  from vault.decrypted_secrets
  where name = 'supabase_webhook_secret'
  limit 1;

  perform net.http_post(
    url := 'https://midjourney-prompt-generator.eu/api/resend-signup',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', webhook_secret
    ),
    body := jsonb_build_object('email', p_email)
  );
end;
$$;

create or replace function public.notify_resend_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Anonymous users have no email yet; they get onboarded on upgrade instead.
  if new.email is null or new.is_anonymous then
    return new;
  end if;

  perform public.send_resend_signup_webhook(new.email);
  return new;
end;
$$;
-- (trigger on_auth_user_created_notify_resend keeps its existing binding)

-- ---------------------------------------------------------------------------
-- 3. One-time welcome bonus when an anonymous user becomes a real account.
--    Fires exactly once: is_anonymous never flips back to true.
-- ---------------------------------------------------------------------------
create or replace function public.handle_anonymous_upgrade()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_credits (user_id, credits_remaining, last_reset)
  values (new.id, 10, current_date)
  on conflict (user_id) do update
    set credits_remaining = greatest(public.user_credits.credits_remaining + 7, 7);

  -- Now that we have an email, fire the onboarding sequence.
  perform public.send_resend_signup_webhook(new.email);

  return new;
end;
$$;

drop trigger if exists on_auth_user_upgraded_from_anonymous on auth.users;

create trigger on_auth_user_upgraded_from_anonymous
  after update on auth.users
  for each row
  when (old.is_anonymous is true and new.is_anonymous is false)
  execute function handle_anonymous_upgrade();

-- ---------------------------------------------------------------------------
-- 4. Refund a reserved credit when server-side generation fails
-- ---------------------------------------------------------------------------
create or replace function public.refund_credit(p_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  remaining integer;
begin
  update public.user_credits
  set
    credits_remaining    = credits_remaining + 1,
    monthly_credits_used = greatest(monthly_credits_used - 1, 0)
  where user_id = p_user_id
  returning credits_remaining into remaining;

  return coalesce(remaining, -1);
end;
$$;
