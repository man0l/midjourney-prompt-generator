-- Enable the pg_cron extension if not already enabled
create extension if not exists pg_cron;

-- Create the scheduled function
create or replace function public.scheduled_reset_daily_credits()
returns void
language plpgsql
security definer
as $$
begin
  update public.user_credits
  set remaining_credits = default_daily_credits;
end;
$$;

-- Schedule the function to run daily at midnight UTC
select cron.schedule(
  'reset-daily-credits',  -- unique job name
  '0 0 * * *',           -- cron expression: "At 00:00 (midnight) every day"
  'select public.scheduled_reset_daily_credits()'
); 