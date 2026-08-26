-- Lock down RLS now that anonymous sign-ins are enabled.
-- Anonymous visitors hold the *authenticated* role, so every policy below
-- applied to them too. These close three holes:

-- ---------------------------------------------------------------------------
-- 1. public.posts was writable by any authenticated user (including
--    anonymous): insert with check (true), update/delete using (true).
--    The app only ever reads posts (SSR + blog pages); content management
--    happens via service role. Drop the blanket write policies.
-- ---------------------------------------------------------------------------
drop policy if exists "Authenticated users can create posts" on public.posts;
drop policy if exists "Authenticated users can update posts" on public.posts;
drop policy if exists "Authenticated users can delete posts" on public.posts;

revoke insert, update, delete on public.posts from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. public.user_credits: any authenticated (incl. anonymous) user could
--    PATCH their own row via PostgREST and mint unlimited credits,
--    bypassing server-side enforcement. All mutations must go through the
--    security-definer RPCs (use_credit / refund_credit); clients keep
--    read-only access for display.
-- ---------------------------------------------------------------------------
drop policy if exists "Users can insert their own credits" on user_credits;
drop policy if exists "Users can update their own credits" on user_credits;

revoke insert, update, delete on public.user_credits from anon, authenticated;

-- Pin both RPCs to the caller: previously anyone could pass an arbitrary
-- p_user_id (drain or refund someone else's credits if the UUID leaked).
create or replace function public.use_credit(p_user_id uuid)
returns integer as $$
declare
  remaining     integer;
  user_plan     text;
  daily_limit   int;
  monthly_limit int;
begin
  -- Only the owner may consume credits.
  if p_user_id is distinct from auth.uid() then
    raise insufficient_privilege using message = 'cannot use credits of another user';
  end if;

  -- Intentionally no coalesce here so we can detect a missing row (NULL vs 'free')
  select plan into user_plan
  from public.user_subscriptions
  where user_id = p_user_id;

  -- No subscription row: skip resets, just decrement whatever credits remain
  if user_plan is null then
    update public.user_credits
    set
      credits_remaining    = credits_remaining - 1,
      monthly_credits_used = monthly_credits_used + 1
    where user_id           = p_user_id
      and credits_remaining > 0
    returning credits_remaining into remaining;
    return coalesce(remaining, -1);
  end if;

  case user_plan
    when 'starter'   then daily_limit := null; monthly_limit := 500;
    when 'pro'       then daily_limit := null; monthly_limit := 1500;
    when 'unlimited' then daily_limit := null; monthly_limit := 999999;
    else                  daily_limit := 3;    monthly_limit := 999999;
  end case;

  -- Free tier: reset daily allowance if it's a new calendar day (even at 0)
  if daily_limit is not null then
    update public.user_credits
    set
      credits_remaining = least(daily_limit, monthly_limit - monthly_credits_used),
      last_reset        = now()
    where user_id   = p_user_id
      and last_reset < current_date;
  end if;

  -- All plans: reset monthly pool if it's a new calendar month (even at 0)
  update public.user_credits
  set
    credits_remaining    = case
                             when daily_limit is not null
                             then least(daily_limit, monthly_limit)
                             else monthly_limit
                           end,
    monthly_credits_used = 0,
    monthly_reset_date   = date_trunc('month', current_date)::date
  where user_id            = p_user_id
    and monthly_reset_date < date_trunc('month', current_date)::date;

  -- Decrement
  update public.user_credits
  set
    credits_remaining    = credits_remaining - 1,
    monthly_credits_used = monthly_credits_used + 1
  where user_id           = p_user_id
    and credits_remaining > 0
  returning credits_remaining into remaining;

  return coalesce(remaining, -1);
end;
$$ language plpgsql security definer;

create or replace function public.refund_credit(p_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  remaining integer;
begin
  -- Only the owner may refund credits.
  if p_user_id is distinct from auth.uid() then
    raise insufficient_privilege using message = 'cannot refund credits of another user';
  end if;

  update public.user_credits
  set
    credits_remaining    = credits_remaining + 1,
    monthly_credits_used = greatest(monthly_credits_used - 1, 0)
  where user_id = p_user_id
  returning credits_remaining into remaining;

  return coalesce(remaining, -1);
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. storage.inspiration-images: uploads were allowed anywhere in the
--    bucket for any authenticated user (free public file hosting).
--    Constrain writes to a per-user folder: <auth.uid()/filename>.
--    Public read stays (the app serves URLs to OpenAI vision).
-- ---------------------------------------------------------------------------
drop policy if exists "Allow authenticated uploads" on storage.objects;

create policy "Allow authenticated uploads to own folder"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'inspiration-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
