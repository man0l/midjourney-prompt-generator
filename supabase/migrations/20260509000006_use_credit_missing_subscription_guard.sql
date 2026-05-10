-- Guard against missing user_subscriptions row: if no row exists, skip resets
-- and just decrement to avoid silently downgrading a paid user to free-tier limits.
create or replace function public.use_credit(p_user_id uuid)
returns integer as $$
declare
  remaining     integer;
  user_plan     text;
  daily_limit   int;
  monthly_limit int;
begin
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
