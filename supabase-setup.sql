-- ============================================================
-- Heritage Quest website — Supabase setup
-- Paste ALL of this into Supabase > SQL Editor > New query > Run
-- ============================================================

-- 1) TABLES --------------------------------------------------
create table if not exists public.ratings (
  id          bigint generated always as identity primary key,
  rating      smallint not null check (rating between 1 and 5),
  nickname    text check (nickname is null or char_length(nickname) <= 30),
  comment     text check (comment is null or char_length(comment) <= 500),
  created_at  timestamptz not null default now()
);

create table if not exists public.feedback (
  id            bigint generated always as identity primary key,
  nickname      text check (nickname is null or char_length(nickname) <= 30),
  feedback_type text not null check (feedback_type in ('Suggestion', 'Bug Report', 'General Feedback')),
  message       text not null check (char_length(trim(message)) between 3 and 1000),
  created_at    timestamptz not null default now()
);

-- 2) ROW LEVEL SECURITY --------------------------------------
alter table public.ratings  enable row level security;
alter table public.feedback enable row level security;

-- Visitors (anon key) may READ and ADD only. No update, no delete.
drop policy if exists "Anyone can read ratings"   on public.ratings;
drop policy if exists "Anyone can add ratings"    on public.ratings;
drop policy if exists "Anyone can read feedback"  on public.feedback;
drop policy if exists "Anyone can add feedback"   on public.feedback;

create policy "Anyone can read ratings"  on public.ratings  for select to anon, authenticated using (true);
create policy "Anyone can add ratings"   on public.ratings  for insert to anon, authenticated with check (true);
create policy "Anyone can read feedback" on public.feedback for select to anon, authenticated using (true);
create policy "Anyone can add feedback"  on public.feedback for insert to anon, authenticated with check (true);

grant select, insert on public.ratings  to anon, authenticated;
grant select, insert on public.feedback to anon, authenticated;

-- 3) AVERAGE + TOTAL (used by the website) -------------------
create or replace view public.rating_summary as
  select count(*)::int as total,
         coalesce(round(avg(rating), 2), 0)::float as average
  from public.ratings;

grant select on public.rating_summary to anon, authenticated;

-- ============================================================
-- OPTIONAL: SAMPLE DATA for testing only.
-- Remove it later in Table Editor (rows start with "[SAMPLE DATA]").
-- ============================================================
-- insert into public.ratings (rating, nickname, comment) values
--   (5, 'Sample Tester', '[SAMPLE DATA] The game was fun and informative.');
-- insert into public.feedback (nickname, feedback_type, message) values
--   (null, 'Suggestion', '[SAMPLE DATA] Add more cultural locations.'),
--   ('Sample Tester', 'Bug Report', '[SAMPLE DATA] The game freezes when entering the next area.');
