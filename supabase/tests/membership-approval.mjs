// From repo root:
// npm install --prefix _workspace/verification --no-save --package-lock=false @electric-sql/pglite
// node supabase/tests/membership-approval.mjs
// Runs all migrations in an ephemeral PostgreSQL instance. Never contacts Supabase.
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { PGlite } from '../../_workspace/verification/node_modules/@electric-sql/pglite/dist/index.js';

const db = new PGlite();
await db.exec(`
  CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
  CREATE SCHEMA auth; CREATE SCHEMA storage;
  CREATE TABLE auth.users (id uuid PRIMARY KEY, email text, raw_user_meta_data jsonb DEFAULT '{}', email_confirmed_at timestamptz, created_at timestamptz DEFAULT now());
  CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$ SELECT current_role::text $$;
  GRANT USAGE ON SCHEMA public, auth, storage TO anon, authenticated, service_role;
  CREATE TABLE storage.buckets (id text PRIMARY KEY, name text, public boolean);
  CREATE TABLE storage.objects (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), bucket_id text, name text);
  ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
`);
const migrations = new URL('../migrations/', import.meta.url);
const names = (await readdir(migrations)).filter(n => n.endsWith('.sql')).sort();
for (const name of names.filter(n => !n.startsWith('012'))) await db.exec(await readFile(new URL(name, migrations), 'utf8'));
await db.exec('GRANT ALL ON ALL TABLES IN SCHEMA public, storage TO anon, authenticated, service_role; GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;');

const operator = '00000000-0000-0000-0000-000000000001';
const member = '00000000-0000-0000-0000-000000000002';
const unverified = '00000000-0000-0000-0000-000000000003';
const child = '00000000-0000-0000-0000-000000000004';
const newcomer = '00000000-0000-0000-0000-000000000005';
await db.query('INSERT INTO auth.users(id,email,email_confirmed_at) VALUES ($1,$2,now()),($3,$4,now()),($5,$6,null)', [operator,'operator@example.test',member,'member@example.test',unverified,'unverified@example.test']);
await db.query("INSERT INTO public.children(id,user_id,name,birth_date,gender) VALUES ($1,$2,'Test child','2020-01-01','male')", [child,member]);
await db.exec(await readFile(new URL('012_membership_approval.sql', migrations), 'utf8'));

async function asUser(id, work, role = 'authenticated') {
  return db.transaction(async tx => {
    await tx.query("SELECT set_config('request.jwt.claim.sub', $1, true)", [id || '']);
    await tx.exec(`SET LOCAL ROLE ${role}`);
    return work(tx);
  });
}
async function denied(id, sql, args = [], role = 'authenticated') {
  await assert.rejects(asUser(id, tx => tx.query(sql, args), role));
}
async function value(id, sql, args = [], role = 'authenticated') {
  const r = await asUser(id, tx => tx.query(sql, args), role);
  return Object.values(r.rows[0] || {})[0];
}

assert.equal((await db.query('SELECT count(*)::int n FROM public.membership_approvals')).rows[0].n, 3);
await db.query('INSERT INTO auth.users(id,email,email_confirmed_at) VALUES ($1,$2,now())', [newcomer,'new@example.test']);
assert.equal((await db.query('SELECT status FROM public.membership_approvals WHERE user_id=$1',[newcomer])).rows[0].status,'pending');
console.log('PASS existing accounts and new signups default to pending');

await denied(member, "UPDATE public.membership_approvals SET status='approved' WHERE user_id=$1",[member]);
await denied(member, 'INSERT INTO public.service_operators(user_id) VALUES ($1)',[member]);
await denied(member, 'SELECT * FROM public.list_memberships()');
await denied(member, 'SELECT public.is_user_approved($1)',[operator]);
await denied(null, 'SELECT public.get_my_membership()',[], 'anon');
assert.equal(await value(member, 'SELECT count(*)::int FROM public.membership_approvals'),1);
assert.equal(await value(member, 'SELECT count(*)::int FROM public.children'),0);
await denied(member, "INSERT INTO public.children(user_id,name,birth_date,gender) VALUES ($1,'Bypass','2020-01-01','male')",[member]);
assert.equal((await asUser(member, tx => tx.query("UPDATE public.children SET name='Bypass' WHERE id=$1 RETURNING id",[child]))).rows.length,0);
assert.equal((await asUser(member, tx => tx.query('DELETE FROM public.children WHERE id=$1 RETURNING id',[child]))).rows.length,0);
await denied(member, "INSERT INTO storage.objects(bucket_id,name) VALUES ('record-photos','bypass.jpg')");
await denied(member, 'SELECT public.remove_family_member($1,$2)',[child,operator]);
await denied(member, "SELECT public.add_family_member_by_email($1,'operator@example.test','viewer')",[child]);
console.log('PASS pending users cannot self-approve, access child data, upload or call privileged RPCs');

await db.query("UPDATE public.membership_approvals SET status='approved' WHERE user_id=$1",[operator]);
await db.query('INSERT INTO public.service_operators(user_id) VALUES ($1)',[operator]);
await denied(operator, "SELECT public.review_membership($1,'approved',1,'review')",[unverified]);
await denied(operator, "SELECT public.review_membership($1,'suspended',1,'self')",[operator]);
await asUser(operator, tx=>tx.query("SELECT public.review_membership($1,'approved',1,'Reviewed')",[member]));
assert.equal(await value(member,'SELECT public.is_approved_member()'),true);
assert.equal(await value(member,'SELECT count(*)::int FROM public.children'),1);
assert.equal(await value(member,'SELECT public.is_service_operator()'),false);
await denied(member,'SELECT * FROM public.list_memberships()'); // family admin is not an operator
await denied(operator, "SELECT public.review_membership($1,'suspended',1,'Stale')",[member]);
await denied(operator, "SELECT public.review_membership($1,'rejected',2,'Invalid transition')",[member]);
await denied(operator, "SELECT public.review_membership($1,'suspended',2,'   ')",[member]);
assert.equal((await db.query('SELECT count(*)::int n FROM public.membership_review_log')).rows[0].n,1);
await asUser(member,tx=>tx.query("INSERT INTO storage.objects(bucket_id,name) VALUES ('record-photos','allowed.jpg')"));
console.log('PASS verified approval, audit, stale decisions, transitions and family/operator separation');

await asUser(operator, tx=>tx.query("SELECT public.review_membership($1,'suspended',2,'Access revoked')",[member]));
assert.equal(await value(member,'SELECT public.is_approved_member()'),false);
assert.equal(await value(member,'SELECT count(*)::int FROM public.children'),0);
assert.equal(await value(member,'SELECT count(*)::int FROM storage.objects'),0);
await denied(member, 'SELECT public.remove_family_member($1,$2)',[child,operator]);
assert.equal(await value(null,'SELECT public.is_user_approved($1)',[member],'service_role'),false);
await asUser(operator,tx=>tx.query("SELECT public.review_membership($1,'approved',3,'Restored')",[member]));
await asUser(operator,tx=>tx.query("SELECT public.review_membership($1,'rejected',1,'Not eligible')",[newcomer]));
await asUser(operator,tx=>tx.query("SELECT public.review_membership($1,'pending',2,'Reconsider')",[newcomer]));
assert.equal(await value(newcomer,'SELECT public.is_approved_member()'),false);
console.log('PASS suspension immediately denies existing identities; restoration and reconsideration work');
await db.close();
