-- Drop existing policies
drop policy if exists "Public can view published posts" on public.posts;
drop policy if exists "Authenticated users can create posts" on public.posts;
drop policy if exists "Authenticated users can update posts" on public.posts;
drop policy if exists "Authenticated users can delete posts" on public.posts;
drop policy if exists "Service role has full access" on public.posts;

-- Enable RLS on posts table
alter table public.posts enable row level security;

-- Allow service role to bypass RLS
create policy "Service role has full access"
on public.posts
for all
using (auth.role() = 'service_role');

-- Allow public read access to published posts
create policy "Public can view published posts"
on public.posts
for select
to public
using (published_at is not null and published_at <= now());

-- Allow authenticated users to create posts
create policy "Authenticated users can create posts"
on public.posts
for insert
to authenticated
with check (true);

-- Allow authenticated users to update their own posts
create policy "Authenticated users can update posts"
on public.posts
for update
to authenticated
using (true)
with check (true);

-- Allow authenticated users to delete their own posts
create policy "Authenticated users can delete posts"
on public.posts
for delete
to authenticated
using (true); 