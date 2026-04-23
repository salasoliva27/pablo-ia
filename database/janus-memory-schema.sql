-- ============================================================
-- JANUS IA — Cross-workspace Memory Table
-- Run once in: supabase.com/dashboard/project/rycybujjedtofghigyxm/sql/new
-- ============================================================
--
-- Convention: janus_ prefix (shared instance, no RLS — service role only)
-- All projects share this table via the workspace column.
--
-- Future: add `embedding vector(1024)` + pgvector index when Voyage AI key available.
-- ============================================================

-- Full-text search extension (already enabled by default in Supabase)
create extension if not exists pg_trgm;

-- ── Main table ────────────────────────────────────────────────────────────────

create table if not exists janus_memories (
  id            uuid primary key default gen_random_uuid(),
  workspace     text        not null,           -- 'pablo-ia', 'janus-ia', 'espacio-bosques', 'lool-ai', etc.
  project       text,                           -- null = cross-project / portfolio-level
  type          text        not null,           -- 'user' | 'feedback' | 'project' | 'reference' | 'session' | 'decision' | 'learning'
  name          text        not null,           -- unique slug within workspace (e.g. 'feedback_testing')
  description   text,                           -- one-liner used for relevance decisions
  content       text        not null,           -- full memory body
  tags          text[]      default '{}',       -- free-form tags for filtering
  archived      boolean     not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  -- Full-text search vector (auto-updated from name + description + content)
  search_vector tsvector generated always as (
    to_tsvector(
      'english',
      coalesce(name, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(content, '') || ' ' ||
      coalesce(workspace, '') || ' ' ||
      coalesce(project, '')
    )
  ) stored,

  -- Enforce uniqueness: same name in same workspace = same memory (upsert target)
  unique (workspace, name)
);

-- ── Indexes ───────────────────────────────────────────────────────────────────

-- Full-text search (primary recall path)
create index if not exists janus_memories_search_idx
  on janus_memories using gin(search_vector);

-- Trigram index for fuzzy name lookup
create index if not exists janus_memories_name_trgm_idx
  on janus_memories using gin(name gin_trgm_ops);

-- Filtered queries by workspace / type / project
create index if not exists janus_memories_scope_idx
  on janus_memories(workspace, type, project, archived, updated_at desc);

-- ── Auto-update updated_at ────────────────────────────────────────────────────

create or replace function janus_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists janus_memories_updated_at on janus_memories;
create trigger janus_memories_updated_at
  before update on janus_memories
  for each row execute function janus_touch_updated_at();

-- ── No RLS — accessed exclusively via service role key ────────────────────────
-- Memories are internal to the portfolio brain. No user-facing auth needed.
alter table janus_memories disable row level security;
