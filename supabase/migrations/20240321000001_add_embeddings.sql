-- Enable the pgvector extension
create extension if not exists vector;

-- Add embedding column to posts table
alter table public.posts 
add column if not exists embedding vector(1536);

-- Create a function to compute similarity
create or replace function get_similar_posts(post_id uuid, limit_count int default 6)
returns table (
    id uuid,
    title text,
    slug text,
    similarity float
) language sql stable as $$
    select 
        p.id,
        p.title,
        p.slug,
        1 - (p.embedding <=> (select embedding from posts where id = post_id)) as similarity
    from posts p
    where p.id != post_id
        and p.published_at is not null 
        and p.published_at <= now()
        and p.embedding is not null
    order by p.embedding <=> (select embedding from posts where id = post_id)
    limit limit_count;
$$; 