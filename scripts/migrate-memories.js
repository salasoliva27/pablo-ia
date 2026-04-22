#!/usr/bin/env node
/**
 * migrate-memories.js
 * One-time migration: reads local memory markdown files → inserts into janus_memories (Supabase).
 *
 * Usage: cp scripts/migrate-memories.js ~/.claude/memory-mcp/migrate.js && cd ~/.claude/memory-mcp && node migrate.js
 * (must run from memory-mcp dir where @supabase/supabase-js is installed)
 *
 * Run AFTER the janus-memory-schema.sql has been executed in Supabase SQL Editor.
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { createClient } from '@supabase/supabase-js';

// ── Load env ─────────────────────────────────────────────────────────────────

function loadDotEnv() {
  try {
    const raw = readFileSync(join(homedir(), '.env'), 'utf8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^(?:export\s+)?([A-Z_][A-Z0-9_]*)=["']?([^"'\n]*)["']?/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
    }
  } catch {}
}

loadDotEnv();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('ERROR: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

// ── Parse frontmatter ─────────────────────────────────────────────────────────

function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, content: raw.trim() };

  const meta = {};
  for (const line of match[1].split('\n')) {
    const [key, ...rest] = line.split(':');
    if (key && rest.length) meta[key.trim()] = rest.join(':').trim();
  }
  return { meta, content: match[2].trim() };
}

// ── Memory directory ──────────────────────────────────────────────────────────

const MEMORY_DIR = join(
  homedir(),
  '.claude/projects/-workspaces-venture-os/memory'
);

async function migrate() {
  let files;
  try {
    files = readdirSync(MEMORY_DIR).filter(f => f.endsWith('.md') && f !== 'MEMORY.md');
  } catch (err) {
    console.error('Could not read memory directory:', err.message);
    process.exit(1);
  }

  console.log(`Found ${files.length} memory files to migrate\n`);

  let inserted = 0, skipped = 0, failed = 0;

  for (const file of files) {
    const raw = readFileSync(join(MEMORY_DIR, file), 'utf8');
    const { meta, content } = parseFrontmatter(raw);

    if (!content.trim()) { skipped++; continue; }

    // Derive name from filename (strip .md)
    const name = file.replace(/\.md$/, '');
    const type = meta.type || 'session';
    const description = meta.description || meta.name || name;

    const row = {
      name,
      content,
      type,
      workspace: 'pablo-ia',
      project: null,
      description,
      tags: [],
      archived: false,
    };

    const { error } = await supabase
      .from('janus_memories')
      .upsert(row, { onConflict: 'workspace,name', ignoreDuplicates: false });

    if (error) {
      console.error(`  ✗ ${file}: ${error.message}`);
      failed++;
    } else {
      console.log(`  ✓ ${file} [${type}]`);
      inserted++;
    }
  }

  console.log(`\nDone: ${inserted} inserted, ${skipped} skipped, ${failed} failed`);
}

migrate();
