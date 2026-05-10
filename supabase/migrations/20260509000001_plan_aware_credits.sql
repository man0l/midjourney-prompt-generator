-- Add monthly tracking columns
alter table public.user_credits
  add column if not exists monthly_credits_used integer not null default 0,
  add column if not exists monthly_reset_date date not null default current_date;

-- Replace the daily reset trigger function with a plan-aware version
create or replace function public.reset_daily_credits()
returns trigger as $$
declare
  user_plan text;
  daily_limit int;
  monthly_limit int;
begin
  select coalesce(plan, 'free') into user_plan
  from public.user_subscriptions
  where user_id = NEW.user_id;

  case coalesce(user_plan, 'free')
    when 'starter'   then daily_limit := null; monthly_limit := 500;
    when 'pro'       then daily_limit := null; monthly_limit := 1500;
    when 'unlimited' then daily_limit := null; monthly_limit := 999999;
    else                  daily_limit := 3;    monthly_limit := 100;
  end case;

  -- Monthly reset (calendar month)
  if NEW.monthly_reset_date < date_trunc('month', current_date)::date then
    NEW.monthly_credits_used := 0;
    NEW.monthly_reset_date := date_trunc('month', current_date)::date;
  end if;

  -- Daily reset
  if OLD.last_reset < current_date then
    if daily_limit is not null then
      NEW.credits_remaining := greatest(0, monthly_limit - NEW.monthly_credits_used);
    else
      NEW.credits_remaining := greatest(0, monthly_limit - NEW.monthly_credits_used);
    end if;
    NEW.last_reset := now();
  end if;

  return NEW;
end;
$$ language plpgsql security definer;

-- Update new-user provisioning to 3 credits (free default)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_credits (user_id, credits_remaining)
  values (new.id, 3)
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- RPC for atomic credit decrement (avoids race conditions in useCredits hook)
create or replace function public.use_credit(p_user_id uuid)
returns integer as $$
declare
  remaining integer;
begin
  update public.user_credits
  set
    credits_remaining = credits_remaining - 1,
    monthly_credits_used = monthly_credits_used + 1
  where user_id = p_user_id
    and credits_remaining > 0
  returning credits_remaining into remaining;

  return coalesce(remaining, -1);
end;
$$ language plpgsql security definer;
