-- Enable pgcrypto extension
create extension if not exists pgcrypto;

-- Create user credits table
create table public.user_credits (
    id uuid default gen_random_uuid() references auth.users on delete cascade primary key,
    credits_remaining integer default 8,
    last_reset timestamp with time zone default now(),
    created_at timestamp with time zone default now()
);

-- Enable RLS (Row Level Security)
alter table public.user_credits enable row level security;

-- Create policies
create policy "Users can view their own credits"
    on public.user_credits for select
    using (auth.uid() = id);

create policy "Users can update their own credits"
    on public.user_credits for update
    using (auth.uid() = id);

-- Create function to reset credits daily
create or replace function public.reset_daily_credits()
returns trigger as $$
begin
    if (OLD.last_reset < current_date) then
        NEW.credits_remaining := 8;
        NEW.last_reset := now();
    end if;
    return NEW;
end;
$$ language plpgsql security definer;

-- Create trigger to auto-reset credits daily
create trigger reset_daily_credits
    before update on public.user_credits
    for each row
    execute function public.reset_daily_credits();

-- Create function to initialize credits for new users
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.user_credits (id)
    values (new.id);
    return new;
end;
$$ language plpgsql security definer;

-- Create trigger to initialize credits for new users
create trigger on_auth_user_created
    after insert on auth.users
    for each row
    execute function public.handle_new_user();

-- Grant necessary permissions
grant usage on schema public to anon, authenticated;
grant select, update on public.user_credits to anon, authenticated; 