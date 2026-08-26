-- Fire the Grok Spicy onboarding email sequence on every new signup.
-- Calls POST /api/resend-signup on the production site, which adds the
-- contact to Resend and fires the `grok.spicy_signup` event.

create extension if not exists pg_net;

create or replace function public.notify_resend_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  webhook_secret text;
begin
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
    body := jsonb_build_object('email', new.email)
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_notify_resend on auth.users;

create trigger on_auth_user_created_notify_resend
  after insert on auth.users
  for each row
  execute function notify_resend_signup();
