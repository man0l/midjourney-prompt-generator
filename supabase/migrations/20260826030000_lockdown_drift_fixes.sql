-- Hardens against configuration drift found during the anonymous-tier security audit:
--
-- 1. A dashboard-created policy ("Authenticated users can update their posts",
--    roles = {public}, qual = auth.role() = 'authenticated', no owner check)
--    let ANY signed-in user — including anonymous visitors — rewrite every blog
--    post. Dropped here so fresh environments can never reproduce it.
-- 2. TRUNCATE on posts was granted to anon/authenticated; TRUNCATE bypasses RLS
--    entirely. Revoked.
-- 3. Full DML on user_subscriptions was granted beyond what the app needs
--    (service role writes subscriptions; users only read their own row).
--    Narrowed to SELECT-only via revoke.
--
-- Idempotent: safe to re-run against any environment.

-- 1. remove the ownerless posts-update policy if it exists
drop policy if exists "Authenticated users can update their posts" on public.posts;

-- 2. nobody but the service role may truncate app tables
revoke truncate on public.posts from anon, authenticated;
revoke truncate on public.user_credits from anon, authenticated;

-- 3. subscriptions are service-write / user-read
revoke insert, update, delete, truncate on public.user_subscriptions from anon, authenticated;
