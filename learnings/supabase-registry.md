# SUPABASE REGISTRY
## All projects share one Supabase instance — tables are prefixed by project name

**Supabase project:** rycybujjedtofghigyxm.supabase.co  
**Credentials:** `$SUPABASE_URL` + `$SUPABASE_SERVICE_ROLE_KEY` (in dotfiles)  
**Convention:** Every project prefixes its tables with `{projectname}_` to avoid collisions.

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
