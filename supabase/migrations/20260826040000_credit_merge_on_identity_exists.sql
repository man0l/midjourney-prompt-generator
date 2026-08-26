-- Handles the identity_already_exists case in the anonymous upgrade flow:
-- an anonymous visitor tries to link Google/Discord, but that provider
-- identity already belongs to an older account. GoTrue refuses the link, so
-- the client instead (1) stages the anonymous user's remaining credits under
-- a one-time token, (2) signs in to the existing account, and (3) completes
-- the transfer from the callback page.
--
-- The staging table has no policies and no grants: only these security
-- definer functions ever touch it.

create table public.credit_merges (
    token             uuid primary key,
    anonymous_user_id uuid not null references auth.users(id) on delete cascade,
    created_at        timestamptz not null default now(),
    expires_at        timestamptz not null
);

alter table public.credit_merges enable row level security;
revoke all on public.credit_merges from anon, authenticated;

-- Called with the anonymous session before redirecting to the provider.
create or replace function public.stage_credit_merge(p_token uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_anonymous boolean;
begin
  if p_token is null then
    raise exception 'merge token required';
  end if;

  select is_anonymous into v_is_anonymous from auth.users where id = auth.uid();
  if v_is_anonymous is not true then
    raise insufficient_privilege;
  end if;

  delete from public.credit_merges where expires_at < now();
  insert into public.credit_merges (token, anonymous_user_id, expires_at)
  values (p_token, auth.uid(), now() + interval '15 minutes')
  on conflict (token) do update
    set anonymous_user_id = excluded.anonymous_user_id,
        expires_at        = excluded.expires_at;
end;
$$;

-- Called with the existing (non-anonymous) account's session after re-auth.
-- Moves the anonymous user's remaining credits over, then removes the
-- anonymous account. Returns the number of credits transferred (0 if the
-- token is unknown, expired, or already used).
create or replace function public.complete_credit_merge(p_token uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_anon_id      uuid;
  v_transferred  integer := 0;
  v_anon_credits integer;
begin
  if auth.uid() is null then
    raise insufficient_privilege;
  end if;
  if exists (select 1 from auth.users where id = auth.uid() and is_anonymous is true) then
    raise insufficient_privilege;
  end if;

  select anonymous_user_id into v_anon_id
  from public.credit_merges
  where token = p_token
    and expires_at > now();
  if v_anon_id is null or v_anon_id = auth.uid() then
    delete from public.credit_merges where token = p_token;
    return 0;
  end if;

  select credits_remaining into v_anon_credits
  from public.user_credits
  where user_id = v_anon_id;
  v_transferred := coalesce(greatest(v_anon_credits, 0), 0);

  if v_transferred > 0 then
    insert into public.user_credits (user_id, credits_remaining)
    values (auth.uid(), v_transferred)
    on conflict (user_id) do update
      set credits_remaining = public.user_credits.credits_remaining + excluded.credits_remaining;
  end if;

  delete from public.user_credits where user_id = v_anon_id;
  delete from public.credit_merges where token = p_token;

  -- Best effort: drop the now-empty anonymous account. If this fails the
  -- transfer above still stands; the orphan is harmless (0 credits).
  begin
    delete from auth.users where id = v_anon_id;
  exception when others then
    null;
  end;

  return v_transferred;
end;
$$;

revoke all on function public.stage_credit_merge(uuid) from public, anon;
revoke all on function public.complete_credit_merge(uuid) from public, anon;
grant execute on function public.stage_credit_merge(uuid) to authenticated;
grant execute on function public.complete_credit_merge(uuid) to authenticated;
