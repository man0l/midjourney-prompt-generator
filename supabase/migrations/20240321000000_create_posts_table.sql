-- Create posts table
create table if not exists public.posts (
    id uuid primary key default uuid_generate_v4(),
    title text not null,
    slug text not null unique,
    content_markdown text not null,
    published_at timestamp with time zone,
    updated_at timestamp with time zone default now(),
    created_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table public.posts enable row level security;

-- Create policies
create policy "Public can read published posts" on public.posts
    for select using (published_at is not null and published_at <= now());

create policy "Authenticated users can create posts" on public.posts
    for insert with check (auth.role() = 'authenticated');

create policy "Authenticated users can update their posts" on public.posts
    for update using (auth.role() = 'authenticated');

-- Create updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger handle_posts_updated_at
    before update on public.posts
    for each row
    execute function public.handle_updated_at(); 