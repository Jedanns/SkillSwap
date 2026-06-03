-- =====================================================================
-- PeerLearn (SkillSwap DSP F2I)
-- Auth->profiles sync trigger, campus-only restriction, Row-Level Security,
-- and full-text/trigram search indexes.
--
-- Apply AFTER `prisma migrate dev` has created the tables (Prisma does not
-- manage triggers, RLS, or pg extensions). Run via the Supabase CLI
-- (`supabase db push`) or paste into the Supabase SQL editor.
--
-- NOTE: the app's Prisma client connects with the secret key over the direct
-- connection, which BYPASSES RLS. Server-side authorization is enforced in the
-- Next.js layer. These policies are the defense-in-depth layer for any
-- client-side `@supabase/ssr` access, required because the platform is a
-- campus multi-tenant space.
-- =====================================================================

-- --------------------------- Extensions -----------------------------
create extension if not exists pg_trgm;

-- ------------------- Auth -> profiles sync trigger ------------------
-- Creates a matching public.profiles row whenever a Supabase auth user is
-- created. Replaces the manual post-signup upsert.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, created_at, updated_at)
  values (new.id, new.email, now(), now())
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Tie every profile to its auth user with ON DELETE CASCADE. This guarantees a
-- profile is removed when its auth user is deleted, so orphan rows can never
-- accumulate — orphans (a profile whose id is absent from auth.users) otherwise
-- break signup, because the trigger's `on conflict (id)` does not catch the
-- `profiles_email_key` unique violation when the same email reappears.
-- NOTE: existing orphans must be deleted before this constraint can be added:
--   delete from public.profiles p
--   where not exists (select 1 from auth.users u where u.id = p.id);
alter table public.profiles drop constraint if exists profiles_id_fkey;
alter table public.profiles
  add constraint profiles_id_fkey
  foreign key (id) references auth.users (id) on delete cascade;

-- ------------------- Email domain restriction (disabled) ------------
-- Sign-up is open to any email domain, so the campus-only CHECK constraint is
-- intentionally NOT created (and dropped if a previous version added it).
alter table public.profiles
  drop constraint if exists profiles_campus_email_chk;

-- ------------------------- Helper functions -------------------------
-- True when the current auth user participates in the given conversation.
create or replace function public.is_conversation_member(conv_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = conv_id
      and cp.profile_id = (select auth.uid())
  );
$$;

-- True when the current auth user is the tutor or an (approved) participant.
create or replace function public.can_view_session(sess_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.tutoring_sessions s
    where s.id = sess_id
      and (
        s.is_public
        or s.tutor_id = (select auth.uid())
        or exists (
          select 1 from public.session_participants sp
          where sp.session_id = s.id
            and sp.student_id = (select auth.uid())
        )
      )
  );
$$;

-- ------------------------------ Enable RLS --------------------------
alter table public.promotions                 enable row level security;
alter table public.profiles                  enable row level security;
alter table public.level_thresholds          enable row level security;
alter table public.activity_events           enable row level security;
alter table public.skill_categories          enable row level security;
alter table public.skills                     enable row level security;
alter table public.skill_notions              enable row level security;
alter table public.user_skills                enable row level security;
alter table public.skill_pings                enable row level security;
alter table public.rubrics                    enable row level security;
alter table public.rubric_criteria            enable row level security;
alter table public.tutoring_sessions          enable row level security;
alter table public.session_participants       enable row level security;
alter table public.reviews                    enable row level security;
alter table public.notion_validations         enable row level security;
alter table public.conversations              enable row level security;
alter table public.conversation_participants  enable row level security;
alter table public.messages                   enable row level security;
alter table public.posts                      enable row level security;
alter table public.post_likes                 enable row level security;
alter table public.comments                   enable row level security;
alter table public.notifications              enable row level security;
alter table public.xp_transactions            enable row level security;

-- ============================== Policies ============================
-- Convention: any authenticated campus user may read shared catalogue/social
-- content; writes are restricted to the owning row's FK = auth.uid().

-- promotions (read-only reference; managed by service role) ----------
create policy "promotions_select" on public.promotions
  for select to authenticated using (true);

-- profiles -----------------------------------------------------------
create policy "profiles_select_authenticated" on public.profiles
  for select to authenticated using (true);
create policy "profiles_update_self" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- level_thresholds (read-only reference; managed by service role) ------
create policy "level_thresholds_select" on public.level_thresholds
  for select to authenticated using (true);

-- activity_events (own ledger only) ----------------------------------
create policy "activity_events_select_own" on public.activity_events
  for select to authenticated using (profile_id = (select auth.uid()));

-- xp_transactions (own ledger; rows are written server-side) ----------
create policy "xp_transactions_select_own" on public.xp_transactions
  for select to authenticated using (profile_id = (select auth.uid()));

-- skill_categories (shared catalogue) --------------------------------
create policy "skill_categories_select" on public.skill_categories
  for select to authenticated using (true);

-- skills (shared catalogue; anyone may create, author may edit) -------
create policy "skills_select" on public.skills
  for select to authenticated using (true);
create policy "skills_insert" on public.skills
  for insert to authenticated with check (created_by_id = (select auth.uid()));
create policy "skills_update_author" on public.skills
  for update to authenticated using (created_by_id = (select auth.uid()));

-- skill_notions (shared syllabus; the owning skill's author manages) --
create policy "skill_notions_select" on public.skill_notions
  for select to authenticated using (true);
create policy "skill_notions_write_skill_author" on public.skill_notions
  for all to authenticated
  using (exists (select 1 from public.skills s where s.id = skill_id and s.created_by_id = (select auth.uid())))
  with check (exists (select 1 from public.skills s where s.id = skill_id and s.created_by_id = (select auth.uid())));

-- user_skills (own attribution rows) ---------------------------------
create policy "user_skills_select" on public.user_skills
  for select to authenticated using (true);
create policy "user_skills_write_own" on public.user_skills
  for all to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));

-- skill_pings --------------------------------------------------------
create policy "skill_pings_select" on public.skill_pings
  for select to authenticated using (true);
create policy "skill_pings_write_own" on public.skill_pings
  for all to authenticated
  using (requester_id = (select auth.uid()))
  with check (requester_id = (select auth.uid()));

-- rubrics (readable; expert owns) ------------------------------------
create policy "rubrics_select" on public.rubrics
  for select to authenticated using (true);
create policy "rubrics_write_own" on public.rubrics
  for all to authenticated
  using (expert_id = (select auth.uid()))
  with check (expert_id = (select auth.uid()));

-- rubric_criteria (managed by the owning expert) ---------------------
create policy "rubric_criteria_select" on public.rubric_criteria
  for select to authenticated using (true);
create policy "rubric_criteria_write_expert" on public.rubric_criteria
  for all to authenticated
  using (exists (select 1 from public.rubrics r where r.id = rubric_id and r.expert_id = (select auth.uid())))
  with check (exists (select 1 from public.rubrics r where r.id = rubric_id and r.expert_id = (select auth.uid())));

-- tutoring_sessions (tutor manages; participants & public can view) --
create policy "tutoring_sessions_select" on public.tutoring_sessions
  for select to authenticated using (public.can_view_session(id));
create policy "tutoring_sessions_insert_tutor" on public.tutoring_sessions
  for insert to authenticated with check (tutor_id = (select auth.uid()));
create policy "tutoring_sessions_update_tutor" on public.tutoring_sessions
  for update to authenticated using (tutor_id = (select auth.uid()));

-- session_participants (visible to session members; student owns own row)
create policy "session_participants_select" on public.session_participants
  for select to authenticated using (public.can_view_session(session_id));
create policy "session_participants_insert" on public.session_participants
  for insert to authenticated
  with check (
    student_id = (select auth.uid())
    or exists (select 1 from public.tutoring_sessions s where s.id = session_id and s.tutor_id = (select auth.uid()))
  );
create policy "session_participants_update" on public.session_participants
  for update to authenticated
  using (
    student_id = (select auth.uid())
    or exists (select 1 from public.tutoring_sessions s where s.id = session_id and s.tutor_id = (select auth.uid()))
  );

-- reviews (visible to the two parties; reviewer writes) --------------
create policy "reviews_select_parties" on public.reviews
  for select to authenticated
  using (reviewer_id = (select auth.uid()) or reviewee_id = (select auth.uid()));
create policy "reviews_insert_reviewer" on public.reviews
  for insert to authenticated with check (reviewer_id = (select auth.uid()));

-- notion_validations (follow their parent review) --------------------
create policy "notion_validations_select" on public.notion_validations
  for select to authenticated
  using (exists (
    select 1 from public.reviews r
    where r.id = review_id
      and (r.reviewer_id = (select auth.uid()) or r.reviewee_id = (select auth.uid()))
  ));
create policy "notion_validations_write_reviewer" on public.notion_validations
  for all to authenticated
  using (exists (select 1 from public.reviews r where r.id = review_id and r.reviewer_id = (select auth.uid())))
  with check (exists (select 1 from public.reviews r where r.id = review_id and r.reviewer_id = (select auth.uid())));

-- conversations (members only) ---------------------------------------
create policy "conversations_select_member" on public.conversations
  for select to authenticated using (public.is_conversation_member(id));

-- conversation_participants ------------------------------------------
create policy "conversation_participants_select_member" on public.conversation_participants
  for select to authenticated using (public.is_conversation_member(conversation_id));
create policy "conversation_participants_update_self" on public.conversation_participants
  for update to authenticated using (profile_id = (select auth.uid()));

-- messages (members read; member sends as self) ---------------------
create policy "messages_select_member" on public.messages
  for select to authenticated using (public.is_conversation_member(conversation_id));
create policy "messages_insert_sender" on public.messages
  for insert to authenticated
  with check (sender_id = (select auth.uid()) and public.is_conversation_member(conversation_id));

-- posts (public feed; author owns) -----------------------------------
create policy "posts_select" on public.posts
  for select to authenticated using (true);
create policy "posts_write_own" on public.posts
  for all to authenticated
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()));

-- post_likes ---------------------------------------------------------
create policy "post_likes_select" on public.post_likes
  for select to authenticated using (true);
create policy "post_likes_write_own" on public.post_likes
  for all to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));

-- comments -----------------------------------------------------------
create policy "comments_select" on public.comments
  for select to authenticated using (true);
create policy "comments_write_own" on public.comments
  for all to authenticated
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()));

-- notifications (recipient only) -------------------------------------
create policy "notifications_select_own" on public.notifications
  for select to authenticated using (recipient_id = (select auth.uid()));
create policy "notifications_update_own" on public.notifications
  for update to authenticated using (recipient_id = (select auth.uid()));

-- ===================== Search indexes (pg_trgm) =====================
create index if not exists skills_name_trgm_idx
  on public.skills using gin (name gin_trgm_ops);
create index if not exists skills_description_trgm_idx
  on public.skills using gin (canonical_description gin_trgm_ops);
create index if not exists profiles_display_name_trgm_idx
  on public.profiles using gin (display_name gin_trgm_ops);
create index if not exists profiles_username_trgm_idx
  on public.profiles using gin (username gin_trgm_ops);
create index if not exists tutoring_sessions_title_trgm_idx
  on public.tutoring_sessions using gin (title gin_trgm_ops);
create index if not exists posts_content_trgm_idx
  on public.posts using gin (content gin_trgm_ops);

-- ===================== Realtime (instant push) ======================
-- Use Supabase Realtime "Postgres Changes" for instant, RLS-aware delivery —
-- the client subscribes to its own rows and receives INSERTs with no polling
-- and no extra infra. Add the tables that drive live UI to the publication.
-- (REPLICA IDENTITY FULL lets row-level filters apply to updates/deletes too.)
alter table public.notifications replica identity full;
alter table public.messages      replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;
