-- Migration: add skill_notions table
-- Each row represents a key concept / chapter associated with a canonical skill.

create table if not exists skill_notions (
  id          uuid        primary key default gen_random_uuid(),
  skill_id    uuid        not null references skills(id) on delete cascade,
  title       text        not null,
  description text,
  position    integer     not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists skill_notions_skill_id_position_idx
  on skill_notions (skill_id, position);

-- RLS: same pattern as other tables — authenticated users can read all notions,
-- only the skill creator (or any certified expert) can insert/update/delete.
alter table skill_notions enable row level security;

create policy "Anyone authenticated can read skill notions"
  on skill_notions for select
  using (auth.role() = 'authenticated');

create policy "Skill creator can manage notions"
  on skill_notions for all
  using (
    exists (
      select 1 from skills s
      where s.id = skill_notions.skill_id
        and s.created_by_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from skills s
      where s.id = skill_notions.skill_id
        and s.created_by_id = auth.uid()
    )
  );
