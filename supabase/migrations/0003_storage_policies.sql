/*
============================================================================
0003_storage_policies.sql

Storage's underlying storage.objects table is NOT the same as the public
schema tables in 0001_init.sql — Supabase manages its RLS separately and
you can't just disable it the way 0002_disable_rls.sql did for your own
tables. It needs explicit policies instead.

Critically: this app authenticates with a custom `users` table, not
Supabase Auth, so every request uses the `anon` role — never
`authenticated`. Default policy templates in the Supabase dashboard usually
target `authenticated`, which will silently match nothing here. These
policies target `anon` explicitly, scoped only to the trade-screenshots
bucket, matching the project's "no security friction" design.
============================================================================
*/

create policy "trade-screenshots anon select"
on storage.objects for select
to anon
using (bucket_id = 'trade-screenshots');

create policy "trade-screenshots anon insert"
on storage.objects for insert
to anon
with check (bucket_id = 'trade-screenshots');

create policy "trade-screenshots anon update"
on storage.objects for update
to anon
using (bucket_id = 'trade-screenshots')
with check (bucket_id = 'trade-screenshots');

create policy "trade-screenshots anon delete"
on storage.objects for delete
to anon
using (bucket_id = 'trade-screenshots');
