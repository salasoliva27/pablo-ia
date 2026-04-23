# CREDENTIALS & TOOL ACCESS CHECK
## Pablo IA — Central Credential Registry
### Last updated: 2026-04-22

---

## HOW THIS WORKS

Secrets are loaded as environment variables. There are two supported layouts —
the dashboard auto-detects which one you're using:

- **Repo-local `.env`** (default for new users): the dashboard's Credentials
  panel writes a `.env` at the repo root. It's added to `.gitignore`
  automatically and never committed.
- **Shared dotfiles repo** (optional): if you maintain a private dotfiles repo
  with `.env` mounted at `/workspaces/.codespaces/.persistedshare/dotfiles/`,
  the dashboard writes there instead, then commits + pushes so every
  Codespace you spin up loads the same keys on creation.

**Never store secrets in any project repo's tracked files.** Never paste a key
into a chat — use the Credentials panel.

When a project needs a tool credential:
- Its own TOOLS.md declares which tools it uses
- It references this file (`pablo-ia/CREDENTIALS.md`) for setup procedure
- It does NOT manage credentials itself

---

## RUN A LIVE CHECK

Paste this in any Codespace terminal to see which keys are loaded right now:

```bash
echo "=== ANTHROPIC ===" && \
  [ -n "$ANTHROPIC_API_KEY" ] && echo "✅ ANTHROPIC_API_KEY" || echo "❌ ANTHROPIC_API_KEY MISSING" && \
echo "=== GITHUB ===" && \
  [ -n "$GITHUB_TOKEN" ] && echo "✅ GITHUB_TOKEN" || echo "❌ GITHUB_TOKEN MISSING" && \
echo "=== BRAVE ===" && \
  [ -n "$BRAVE_API_KEY" ] && echo "✅ BRAVE_API_KEY" || echo "❌ BRAVE_API_KEY MISSING" && \
echo "=== SUPABASE ===" && \
  [ -n "$SUPABASE_URL" ] && echo "✅ SUPABASE_URL" || echo "❌ SUPABASE_URL MISSING" && \
  [ -n "$SUPABASE_SERVICE_ROLE_KEY" ] && echo "✅ SUPABASE_SERVICE_ROLE_KEY" || echo "❌ SUPABASE_SERVICE_ROLE_KEY MISSING" && \
echo "=== GOOGLE WORKSPACE MCP ===" && \
  [ -n "$GOOGLE_CLIENT_ID" ] && echo "✅ GOOGLE_CLIENT_ID" || echo "❌ GOOGLE_CLIENT_ID MISSING" && \
  [ -n "$GOOGLE_CLIENT_SECRET" ] && echo "✅ GOOGLE_CLIENT_SECRET" || echo "❌ GOOGLE_CLIENT_SECRET MISSING" && \
  [ -f "/home/codespace/.config/google-workspace/tokens.json" ] && echo "✅ OAuth tokens file present" || echo "⚠️  OAuth tokens not yet generated — run: npx @alanse/mcp-server-google-workspace auth" && \
echo "=== N8N ===" && \
  [ -n "$N8N_API_KEY" ] && echo "✅ N8N_API_KEY" || echo "❌ N8N_API_KEY MISSING" && \
  [ -n "$N8N_BASE_URL" ] && echo "✅ N8N_BASE_URL" || echo "❌ N8N_BASE_URL MISSING" && \
echo "=== CLOUDFLARE ===" && \
  [ -n "$CLOUDFLARE_API_TOKEN" ] && echo "✅ CLOUDFLARE_API_TOKEN" || echo "❌ CLOUDFLARE_API_TOKEN MISSING" && \
  [ -n "$CLOUDFLARE_ACCOUNT_ID" ] && echo "✅ CLOUDFLARE_ACCOUNT_ID" || echo "❌ CLOUDFLARE_ACCOUNT_ID MISSING" && \
echo "=== VOYAGE AI (memory embeddings) ===" && \
  [ -n "$VOYAGE_API_KEY" ] && echo "✅ VOYAGE_API_KEY" || echo "❌ VOYAGE_API_KEY MISSING"
```

---

## CURRENT STATUS (as of 2026-03-25)

| Env var | Status | MCP server / tool it unlocks |
|---|---|---|
| `ANTHROPIC_API_KEY` | ✅ Present | Claude API, memory embeddings fallback |
| `GITHUB_TOKEN` | ✅ Present (Codespace-scoped) | GitHub MCP — push only to the current repo; **replace with PAT to unlock all repos** (see below) |
| `BRAVE_API_KEY` | ✅ Present | Brave Search MCP |
| `SUPABASE_URL` | ✅ Present | Cross-workspace memory MCP |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Present | Cross-workspace memory MCP |
| `VOYAGE_API_KEY` | ✅ Present | Memory MCP — high-quality embeddings |
| `GCAL_CREDENTIALS` | ✅ Present (raw JSON) | Not consumed directly by MCP |
| `GMAIL_CREDENTIALS` | ✅ Present (raw JSON) | Not consumed directly by MCP |
| `GDRIVE_CREDENTIALS` | ✅ Present (raw JSON) | Not consumed directly by MCP |
| `GOOGLE_CLIENT_ID` | ⚠️ In dotfiles, not loaded yet | Google Workspace MCP — needs Codespace rebuild to load |
| `GOOGLE_CLIENT_SECRET` | ⚠️ In dotfiles, not loaded yet | Google Workspace MCP — needs Codespace rebuild to load |
| `N8N_API_KEY` | ⏸️ Deferred | n8n MCP — activate only when a client project requires it |
| `N8N_BASE_URL` | ⏸️ Deferred | n8n MCP |
| `CLOUDFLARE_API_TOKEN` | ⏸️ Deferred | Cloudflare MCP — activate only when a project needs R2/Workers/Pages |
| `CLOUDFLARE_ACCOUNT_ID` | ⏸️ Deferred | Cloudflare MCP |

---

## FIXING MISSING CREDENTIALS

Two ways to add a key. Use whichever fits your setup.

**Option A — dashboard Credentials panel (recommended for new users):**
Open the Pablo IA dashboard → click the key icon → expand the relevant
provider → paste the value → save. The bridge writes to `.env` at the repo
root (auto-gitignored, never committed) and updates `process.env` so the
running bridge sees the new value immediately.

**Option B — shared dotfiles repo (for cross-Codespace sync):**
If you maintain a private `dotfiles` repo with a `.env` file that loads into
every Codespace you create, append the key there and push. The dashboard
detects this layout (`/workspaces/.codespaces/.persistedshare/dotfiles/.env`)
and writes there instead — committing + pushing automatically. For the current
session you can also `export VAR=value` in any terminal.

---

### 1. GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET

**Both vars are already in dotfiles.** They just haven't loaded into the current Codespace session because the Codespace was created before they were added.

**To load them now without rebuilding** (run in terminal):
```bash
source /workspaces/.codespaces/.persistedshare/dotfiles/.env
```
Or rebuild this Codespace (Codespaces → Rebuild) — they'll auto-load on next start.

**To verify once loaded:**
```bash
echo $GOOGLE_CLIENT_ID && echo $GOOGLE_CLIENT_SECRET
```

**Then, one-time OAuth flow** (run once per Codespace machine):
```bash
npx @alanse/mcp-server-google-workspace -s user auth
```
This opens a browser, you approve access, tokens are saved to `/home/codespace/.config/google-workspace/`. After this, the MCP server can access Gmail, Calendar, Drive, Sheets, Docs, Slides, Forms, Tasks, and Chat — all from a single auth.

**What this unlocks:**
- Read/send Gmail, search threads, create drafts
- Create, update, delete Calendar events; detect schedule conflicts
- Read/write/upload Google Drive files
- Create and edit Google Sheets (financial trackers, lead lists)
- Create Google Docs (proposals, briefs)
- Create Google Slides (pitch decks, presentations)
- Google Forms (intake forms, surveys)
- Google Tasks (to-do lists synced to Calendar)
- Google Chat (team messaging)

**Where to find / regenerate if needed:**
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Select project `test-api-383319`
3. APIs & Services → Credentials → your OAuth 2.0 Client ID
4. The client ID and secret are shown there

---

### 2. N8N_API_KEY + N8N_BASE_URL

**What n8n unlocks from Claude Code:**
- Create, read, update, delete workflows
- Trigger workflow executions
- Inspect execution history and logs
- Build the freelance-system automation pipeline from here

**Where to find:**

**If using n8n Cloud (app.n8n.cloud):**
1. Log in at [app.n8n.cloud](https://app.n8n.cloud)
2. Settings (bottom-left gear icon) → API
3. Click "Create an API key"
4. `N8N_BASE_URL` = `https://your-instance-name.app.n8n.cloud`

**If self-hosting n8n:**
1. Go to your n8n URL → Settings → API
2. Generate API key there
3. `N8N_BASE_URL` = your instance URL (e.g., `https://n8n.yourdomain.com`)

**If n8n is not yet set up:**
- Fastest path: [app.n8n.cloud](https://app.n8n.cloud) — free tier includes 5 active workflows
- For production: deploy via Railway, Render, or a VPS. See [n8n self-hosting docs](https://docs.n8n.io/hosting/)

Add via the dashboard Credentials panel (writes to repo `.env`), or to your
shared dotfiles `.env` if you maintain one:
```
N8N_API_KEY=<your_n8n_api_key>
N8N_BASE_URL=https://your-instance.app.n8n.cloud
```

---

### 3. CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID

**What Cloudflare unlocks from Claude Code:**
- Upload and manage media in R2 (glasses product images for lool-ai, campaign assets)
- Deploy and manage Workers (edge functions)
- Read/write KV stores
- Manage Cloudflare Pages deployments
- DNS management

**Where to find:**

**Account ID:**
1. Log in at [dash.cloudflare.com](https://dash.cloudflare.com)
2. Click on any domain (or go to the main dashboard)
3. Right sidebar → "Account ID" — copy it

**API Token:**
1. [dash.cloudflare.com](https://dash.cloudflare.com) → top-right profile icon → "My Profile"
2. API Tokens → "Create Token"
3. Use template "Edit Cloudflare Workers" or "Custom token"
4. Recommended permissions for full access:
   - Account: Cloudflare R2 Storage — Edit
   - Account: Workers KV Storage — Edit
   - Account: Workers Scripts — Edit
   - Zone: DNS — Edit (if you want DNS control)
5. Copy the token immediately — shown only once

Add via the dashboard Credentials panel (writes to repo `.env`), or to your
shared dotfiles `.env` if you maintain one:
```
CLOUDFLARE_API_TOKEN=<your_cloudflare_api_token>
CLOUDFLARE_ACCOUNT_ID=<your_account_id>
```

---

### 4. VOYAGE_API_KEY

**What it unlocks:** Higher-quality embeddings for the cross-workspace memory MCP (recall/remember). Without it, the system falls back to Anthropic embeddings — still functional, just slightly lower recall quality.

**Lower priority** — everything else works without this.

**Where to find:**
1. Go to [dash.voyageai.com](https://dash.voyageai.com)
2. Sign up / log in
3. API Keys → Create key
4. Free tier includes 50M tokens/month — sufficient for this use case

Add via the dashboard Credentials panel (writes to repo `.env`), or to your
shared dotfiles `.env` if you maintain one:
```
VOYAGE_API_KEY=<your_voyage_api_key>
```

---

### 5. GITHUB_TOKEN — Cross-repo PAT (only if you want to push to other repos)

**Current situation:** Every new Codespace injects a scoped `GITHUB_TOKEN` that
only works for that repo. This causes 403 on cross-repo pushes.

**Fix (only if you need it):** Replace it with a Classic PAT. If you maintain
a shared dotfiles repo, drop it there once and every future Codespace gets it
on creation. If you only work in this repo, you can skip this step entirely.

**Steps (one time):**
1. github.com → Settings → Developer Settings → Personal access tokens → **Tokens (classic)**
2. "Generate new token (classic)"
3. **Expiration: No expiration** (or set a rotation date you'll honor)
4. **Scopes: check `repo`**
5. Generate → copy immediately (shown only once)

Add via the dashboard Credentials panel, or to your shared dotfiles `.env`:
```
GITHUB_TOKEN=ghp_your_new_pat_here
```

**Why Classic PAT, not Fine-grained?**
Fine-grained PATs support "All repositories" but max out at 1 year expiration.
Classic PATs can be set to no expiration. For a solo portfolio, that tradeoff
is worth it.

---

## WHAT EACH TOOL CAN DO (full capability map)

### Google Workspace MCP — after auth setup
| API | What Claude Code can do |
|---|---|
| Gmail | Search, read, create drafts, send, label, organize threads |
| Google Calendar | Create/update/delete events, check availability, detect scheduling conflicts |
| Google Drive | Upload files, create folders, share links, read documents |
| Google Sheets | Create spreadsheets, read/write cells, build financial trackers and lead CSVs |
| Google Docs | Create documents, write and edit content, export to PDF |
| Google Slides | Create presentations, add slides, format pitch decks |
| Google Forms | Create intake forms with questions, read responses |
| Google Tasks | Create and update tasks, sync with Calendar |
| Google Chat | Read/post messages in spaces (if enabled on workspace) |

### n8n MCP
| Action | What Claude Code can do |
|---|---|
| Workflows | Create, read, update, delete, activate/deactivate |
| Executions | Trigger a run, get execution history, inspect errors |
| Credentials | List (read-only, values redacted) |
| Variables | Create and update environment variables |

### Cloudflare MCP
| Service | What Claude Code can do |
|---|---|
| R2 | List buckets, upload/download objects, set CORS, manage lifecycle |
| Workers | Deploy scripts, set env vars, view logs |
| KV | Create namespaces, read/write/delete key-value pairs |
| Pages | Deploy projects, view deployments |
| DNS | Create/update/delete DNS records |

### Brave Search MCP
| Use | What Claude Code can do |
|---|---|
| Web search | Market research, competitor analysis, news, pricing benchmarks |
| Local search | Find businesses by location |

---

## HOW PROJECTS REFERENCE THIS FILE

Each project in the portfolio has its own TOOLS.md that lists which tools it uses. For credential setup, it always points here. Template line for any project's TOOLS.md:

```
## Credential setup
All credentials are managed centrally. See pablo-ia/CREDENTIALS.md for:
- How to run the live check
- How to fix any missing keys in the dotfiles repo
- Where to find / regenerate each key
```

Projects never duplicate credential setup instructions. If instructions drift between repos, the pablo-ia version wins.

---

## MEMORY + VAULT TOOLS

### claude-mem
Where to get: No key needed
Install: `npx claude-mem install`
Web viewer: http://localhost:37777
Search: `/mem-search` in Claude Code
Status: ✅ Installed (v12.1.0) — automatic session capture
Notes: Hooks into session lifecycle. Replaces manual remember() at session end for standard sessions.

### mcpvault (Obsidian MCP)
Where to get: No key needed
Install: npx @bitbonsai/mcpvault /workspaces/pablo-ia
Status: ✅ In .mcp.json (obsidian-vault server)
Notes: Reads/writes pablo-ia vault from Codespace. 14 tools for vault operations.

### obra/knowledge-graph
Where to get: No key needed
Install: npx obra-knowledge-graph (KG_VAULT_PATH set in .mcp.json)
Status: ✅ In .mcp.json (knowledge-graph server)
Notes: Graph traversal on vault. Semantic search + path finding across [[wiki links]].

### Graphify
Where to get: No key needed (uses ANTHROPIC_API_KEY for semantic extraction)
Install: ⚠️ NOT AVAILABLE — pip package doesn't exist; npm @mohammednagy/graphify-ts@0.1.5 has broken peer dep (missing typescript)
Status: ⬜ Blocked — check back when package matures
Notes: Intended for codebase structure graph per repo. Try again when a stable version ships.

### SUPABASE_ACCESS_TOKEN
Where to get: supabase.com/dashboard/account/tokens → Generate new token → name "pablo-ia-mcp"
Add via the dashboard Credentials panel, or to your shared dotfiles `.env`.

### SUPABASE_PROJECT_REF
Value: your Supabase project ref (visible in the project's URL on supabase.com/dashboard).
Add via the dashboard Credentials panel, or to your shared dotfiles `.env`.

---

## ADDING A NEW TOOL

The dashboard's **Credentials → Add tool** form does steps 1 + 2 in one
submit: it writes the env var to `.env` and (optionally) registers an MCP
server in `.mcp.json`. After that:

3. Add a row to the status table above so future you remembers what's wired
4. Add a "where to find" section below if the key isn't obvious to regenerate
5. Update `TOOLS.md` with the new tool entry
6. Restart Claude Code (MCP servers load at startup)
