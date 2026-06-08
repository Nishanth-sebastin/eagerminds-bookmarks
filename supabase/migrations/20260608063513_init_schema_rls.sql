-- Phase 2b — schema + Row Level Security (the privacy core).
-- Idempotent: safe to run more than once.
--
-- Security model:
--   * RLS is the real authorization boundary — every table below enables it.
--   * Policies key off auth.uid() so one user can never read/modify another's
--     private rows, even via direct PostgREST calls with the anon key.
--   * Public visibility is opt-in per bookmark (is_public) and filtered in the
--     SELECT policy, not just in the UI.

-- ============================================================================
-- profiles — one row per user; claims a unique, public @handle
-- ============================================================================
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  handle     text not null unique,
  created_at timestamptz not null default now(),
  constraint profiles_handle_format check (handle ~ '^[a-z0-9_]{3,30}$')
);

comment on table public.profiles is
  'Public-facing user profile. handle is the unique @handle used at /<handle>.';

alter table public.profiles enable row level security;

-- Anyone (even logged out) may read profiles — needed to resolve /<handle>.
-- Profiles contain no sensitive data (no email); handles are public by design.
drop policy if exists "Profiles are readable by everyone" on public.profiles;
create policy "Profiles are readable by everyone"
  on public.profiles for select
  using (true);

-- A user may insert only their own profile row.
drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- A user may update only their own profile (e.g. change their handle).
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ============================================================================
-- bookmarks — each belongs to exactly one user; is_public controls visibility
-- ============================================================================
create table if not exists public.bookmarks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  title      text not null check (char_length(title) between 1 and 200),
  url        text not null check (char_length(url) between 1 and 2048),
  is_public  boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bookmarks_user_id_idx
  on public.bookmarks (user_id);
-- Speeds up the public profile query (public rows for one user).
create index if not exists bookmarks_public_idx
  on public.bookmarks (user_id) where is_public;

alter table public.bookmarks enable row level security;

-- SELECT: the owner sees all their own rows; anyone may see public rows.
drop policy if exists "Read own or public bookmarks" on public.bookmarks;
create policy "Read own or public bookmarks"
  on public.bookmarks for select
  using (auth.uid() = user_id or is_public = true);

-- INSERT: only on behalf of yourself.
drop policy if exists "Insert own bookmarks" on public.bookmarks;
create policy "Insert own bookmarks"
  on public.bookmarks for insert
  with check (auth.uid() = user_id);

-- UPDATE: only your own rows, and you cannot reassign ownership.
drop policy if exists "Update own bookmarks" on public.bookmarks;
create policy "Update own bookmarks"
  on public.bookmarks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- DELETE: only your own rows.
drop policy if exists "Delete own bookmarks" on public.bookmarks;
create policy "Delete own bookmarks"
  on public.bookmarks for delete
  using (auth.uid() = user_id);

-- Keep updated_at fresh on every UPDATE.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists bookmarks_set_updated_at on public.bookmarks;
create trigger bookmarks_set_updated_at
  before update on public.bookmarks
  for each row execute function public.set_updated_at();

-- ============================================================================
-- Auto-provision a profile for every new auth user, guaranteeing a unique
-- handle on day one. Uses the `handle` from signup metadata when present and
-- valid, otherwise a uid-derived slug; collisions get a numeric suffix.
-- The user can change their handle later (guarded by the UPDATE policy above).
-- SECURITY DEFINER so the trigger can write to public.profiles past RLS.
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  desired   text;
  candidate text;
  suffix    int := 0;
begin
  desired := lower(coalesce(
    new.raw_user_meta_data ->> 'handle',
    'user_' || left(replace(new.id::text, '-', ''), 8)
  ));
  desired := regexp_replace(desired, '[^a-z0-9_]', '', 'g');
  if char_length(desired) < 3 then
    desired := 'user_' || left(replace(new.id::text, '-', ''), 8);
  end if;
  desired := left(desired, 26);

  candidate := desired;
  while exists (select 1 from public.profiles where handle = candidate) loop
    suffix := suffix + 1;
    candidate := desired || '_' || suffix::text;
  end loop;

  insert into public.profiles (id, handle) values (new.id, candidate);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
