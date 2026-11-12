-- Row Level Security. Summary table: docs/05-modelo-de-dados.md
--
-- Roles:
--   anon           not signed in
--   authenticated  signed in; app users are anonymous Supabase Auth users,
--                  curators are listed in public.curator
--   service_role   pipeline and admin backend; bypasses RLS
-- No policy = no access.

-- ---------------------------------------------------------------------------
-- Helper functions (security definer avoids recursive policy evaluation)
-- ---------------------------------------------------------------------------
create function public.is_curator() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.curator where user_id = (select auth.uid()));
$$;

create function public.is_point_public(pid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.point p
    where p.id = pid and p.status = 'publicado' and p.sensitivity <> 'restrito'
  );
$$;

create function public.is_source_public(sid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.point_source ps
                 where ps.source_id = sid and public.is_point_public(ps.point_id))
      or exists (select 1 from public.challenge c
                 where c.source_id = sid and public.is_point_public(c.point_id))
      or exists (select 1 from public.toponym t
                 where t.source_id = sid and t.status = 'publicado');
$$;

create function public.is_classroom_member(cid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.classroom_member m
                 where m.classroom_id = cid and m.user_id = (select auth.uid()));
$$;

-- ---------------------------------------------------------------------------
-- Enable RLS everywhere
-- ---------------------------------------------------------------------------
alter table public.partner          enable row level security;
alter table public.source           enable row level security;
alter table public.point            enable row level security;
alter table public.point_source     enable row level security;
alter table public.challenge        enable row level security;
alter table public.toponym          enable row level security;
alter table public.trail            enable row level security;
alter table public.trail_point      enable row level security;
alter table public.validation       enable row level security;
alter table public.ai_proposal      enable row level security;
alter table public.discovery        enable row level security;
alter table public.classroom        enable row level security;
alter table public.classroom_member enable row level security;
alter table public.content_chunk    enable row level security;
alter table public.curator          enable row level security;

-- ---------------------------------------------------------------------------
-- Public content: read only what is published and not restricted
-- ---------------------------------------------------------------------------
create policy point_public_read on public.point
  for select to anon, authenticated
  using (status = 'publicado' and sensitivity <> 'restrito');

create policy challenge_public_read on public.challenge
  for select to anon, authenticated
  using (public.is_point_public(point_id));

create policy toponym_public_read on public.toponym
  for select to anon, authenticated
  using (status = 'publicado');

create policy trail_public_read on public.trail
  for select to anon, authenticated
  using (status = 'publicado');

create policy trail_point_public_read on public.trail_point
  for select to anon, authenticated
  using (
    public.is_point_public(point_id)
    and exists (select 1 from public.trail t where t.id = trail_id and t.status = 'publicado')
  );

create policy source_public_read on public.source
  for select to anon, authenticated
  using (public.is_source_public(id));

create policy point_source_public_read on public.point_source
  for select to anon, authenticated
  using (public.is_point_public(point_id));

-- ---------------------------------------------------------------------------
-- Curators: full read/write on curation tables
-- ---------------------------------------------------------------------------
create policy point_curator_all        on public.point        for all to authenticated using (public.is_curator()) with check (public.is_curator());
create policy challenge_curator_all    on public.challenge    for all to authenticated using (public.is_curator()) with check (public.is_curator());
create policy toponym_curator_all      on public.toponym      for all to authenticated using (public.is_curator()) with check (public.is_curator());
create policy trail_curator_all        on public.trail        for all to authenticated using (public.is_curator()) with check (public.is_curator());
create policy trail_point_curator_all  on public.trail_point  for all to authenticated using (public.is_curator()) with check (public.is_curator());
create policy source_curator_all       on public.source       for all to authenticated using (public.is_curator()) with check (public.is_curator());
create policy point_source_curator_all on public.point_source for all to authenticated using (public.is_curator()) with check (public.is_curator());
create policy validation_curator_all   on public.validation   for all to authenticated using (public.is_curator()) with check (public.is_curator());
create policy ai_proposal_curator_all  on public.ai_proposal  for all to authenticated using (public.is_curator()) with check (public.is_curator());
create policy partner_curator_all      on public.partner      for all to authenticated using (public.is_curator()) with check (public.is_curator());

-- Read-only for curators; writes only via service role.
create policy content_chunk_curator_read on public.content_chunk for select to authenticated using (public.is_curator());
create policy curator_curator_read       on public.curator       for select to authenticated using (public.is_curator());

-- ---------------------------------------------------------------------------
-- Discoveries: each user manages only their own; only published points
-- ---------------------------------------------------------------------------
create policy discovery_own_read on public.discovery
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_curator());

create policy discovery_own_insert on public.discovery
  for insert to authenticated
  with check (user_id = (select auth.uid()) and public.is_point_public(point_id));

create policy discovery_own_update on public.discovery
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and public.is_point_public(point_id));

-- LGPD: users can erase their own progress.
create policy discovery_own_delete on public.discovery
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Classrooms (Could). Joining by code will be a security definer RPC (later).
-- ---------------------------------------------------------------------------
create policy classroom_read on public.classroom
  for select to authenticated
  using (teacher_user_id = (select auth.uid())
         or public.is_classroom_member(id)
         or public.is_curator());

create policy classroom_teacher_insert on public.classroom
  for insert to authenticated
  with check (teacher_user_id = (select auth.uid()));

create policy classroom_teacher_update on public.classroom
  for update to authenticated
  using (teacher_user_id = (select auth.uid()))
  with check (teacher_user_id = (select auth.uid()));

create policy classroom_teacher_delete on public.classroom
  for delete to authenticated
  using (teacher_user_id = (select auth.uid()));

create policy classroom_member_read on public.classroom_member
  for select to authenticated
  using (public.is_classroom_member(classroom_id)
         or exists (select 1 from public.classroom c
                    where c.id = classroom_id and c.teacher_user_id = (select auth.uid()))
         or public.is_curator());

create policy classroom_member_leave on public.classroom_member
  for delete to authenticated
  using (user_id = (select auth.uid()));
