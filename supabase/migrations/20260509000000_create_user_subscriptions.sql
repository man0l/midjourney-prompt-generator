create table public.user_subscriptions (
  user_id uuid references auth.users on delete cascade primary key,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  plan text not null default 'free',
  status text not null default 'active',
  current_period_end timestamptz
);

alter table public.user_subscriptions enable row level security;

create policy "Users read own subscription"
  on public.user_subscriptions for select
  using (auth.uid() = user_id);

-- Service role can do everything (needed for webhook handler)
create policy "Service role full access"
  on public.user_subscriptions for all
  using (auth.role() = 'service_role');
