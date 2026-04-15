# SUPABASE REGISTRY
## All projects share one Supabase instance — tables are prefixed by project name

**Supabase project:** rycybujjedtofghigyxm.supabase.co  
**Credentials:** `$SUPABASE_URL` + `$SUPABASE_SERVICE_ROLE_KEY` (in dotfiles)  
**Convention:** Every project prefixes its tables with `{projectname}_` to avoid collisions.

---

## Janus IA — Cross-workspace Memory (`salasoliva27/venture-os`)

| Table | Purpose | Key columns |
|---|---|---|
| `janus_memories` | All AI memories across every repo — sessions, decisions, learnings, user profile, feedback | `id`, `workspace`, `project`, `type`, `name`, `description`, `content`, `tags`, `search_vector` (tsvector), `archived`, `created_at`, `updated_at` |

**Schema file:** `venture-os/database/janus-memory-schema.sql`  
**MCP server:** `~/.claude/memory-mcp/index.js` (registered in `~/.claude/settings.json`)  
**Tools:** `mcp__janus-memory__recall`, `mcp__janus-memory__remember`, `mcp__janus-memory__forget`, `mcp__janus-memory__list_memories`  
**Migration script:** `venture-os/scripts/migrate-memories.js` (run once after schema)  
**RLS:** Enabled (2026-04-15) — no policies needed, service role key bypasses RLS. See [[concepts/rls-by-default]].  
**Search:** Full-text via `tsvector` (`websearch_to_tsquery`). Vector column can be added later with Voyage AI key.  
**Workspace values:** `janus-ia`, `espacio-bosques`, `lool-ai`, `nutria-app`, `longevite`, `freelance-system`  
**Status:** ✅ Schema ready — run `database/janus-memory-schema.sql` in Supabase SQL Editor, then `node scripts/migrate-memories.js`

---

## nutrIA (`salasoliva27/nutria-app`)

| Table | Purpose | Key columns |
|---|---|---|
| `nutria_conversations` | Full message history per user (one row per user) | `user_id`, `messages jsonb`, `updated_at` |
| `nutria_patient_profiles` | Structured patient profile extracted from intake | `user_id`, `name`, `age`, `sex`, `weight_kg`, `height_cm`, `bmi`, `goal`, `conditions[]`, `medications[]`, `allergies[]`, `activity_level`, `intake_complete` |

**Schema file:** `nutria-app/database/schema.sql`  
**RLS:** Both tables have row-level security — users can only access their own rows (`auth.uid() = user_id`).  
**Profile extraction:** Fires automatically at message milestones (8, 16, 24...) using claude-haiku. Stops when `intake_complete = true`.  
**Status:** ⬜ Schema not yet run — Jano needs to execute `database/schema.sql` in Supabase SQL Editor.

---

## espacio-bosques (`salasoliva27/espacio_bosques`)

| Table | Purpose | Key columns |
|---|---|---|
| `eb_profiles` | One row per registered user — mirrors auth.users + app fields | `id (uuid→auth.users)`, `display_name`, `full_name`, `neighborhood`, `rfc text UNIQUE`, `rfc_verified bool`, `rfc_status text`, `birth_date date` |

**Schema file:** `espacio_bosques/database/schema.sql`  
**Storage doc:** `espacio_bosques/SUPABASE.md`  
**RLS:** Users can only read/write their own row (`auth.uid() = id`).  
**Architecture note:** Projects/investments/governance/providers live in `backend/sim-data.json` (POC). Migration path documented in SUPABASE.md.  
**Status:** ✅ Schema ready — run `database/schema.sql` in Supabase SQL Editor.  
**RFC metadata:** `full_name`, `rfc`, `rfc_verified`, `rfc_status`, `birth_date` also stored in `auth.users.user_metadata` for JWT-accessible profile data without a DB round-trip.

---

## Adding a new project's tables

1. Add a section here with the table names and purpose
2. Prefix every table with `{projectname}_`
3. Always enable RLS with `auth.uid() = user_id` policy
4. Add schema file to the project repo at `database/schema.sql`

---

## Access pattern from code

```js
// Always import from shared/lib/supabase.js
import { supabase } from '@shared/lib/supabase.js'

// Query your project's table
const { data } = await supabase
  .from('nutria_conversations')   // ← prefixed
  .select('*')
  .eq('user_id', userId)
  .single()
```
