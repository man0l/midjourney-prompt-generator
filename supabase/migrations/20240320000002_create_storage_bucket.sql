-- Create a new storage bucket for inspiration images
insert into storage.buckets (id, name, public)
values ('inspiration-images', 'inspiration-images', true);

-- Set up storage policy to allow authenticated uploads
create policy "Allow authenticated uploads"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'inspiration-images'
    and auth.role() = 'authenticated'
  );

-- Set up storage policy to allow public reads
create policy "Allow public reads"
  on storage.objects
  for select
  to public
  using (bucket_id = 'inspiration-images'); 