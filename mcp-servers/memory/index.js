#!/usr/bin/env node
/**
 * Janus IA — Cross-workspace Memory MCP Server v2
 *
 * Stores and retrieves memories across all project workspaces using
 * Supabase + pgvector. Captures everything: sessions, decisions,
 * learnings, corrections, feedback, outcomes, and patterns.
 *
 * Tools:
 *   remember(content, workspace, project?, type?, metadata?, tags?)
 *   recall(query, workspace?, project?, type?, limit?)
 *   forget(id)
 *   list_memories(workspace?, project?, type?, limit?, offset?)
 *   capture_correction(original, correction, context, workspace, project?)
 *   capture_session_summary(summary, workspace, projects_touched, decisions?, learnings?)
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const VOYAGE_KEY = process.env.VOYAGE_API_KEY
const VECTOR_DIMS = 512

async function generateEmbedding(text) {
  if (!VOYAGE_KEY) return null
  try {
    const res = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VOYAGE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ model: 'voyage-3-lite', input: [text] })
    })
    const data = await res.json()
    return data.data?.[0]?.embedding ?? null
  } catch {
    return null
  }
}

const server = new Server(
  { name: 'janus-memory', version: '2.0.0' },
  { capabilities: { tools: {} } }
)

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'remember',
      description: 'Store a memory tagged with workspace, project, and type. Use for any knowledge worth persisting: decisions, learnings, corrections, session summaries, patterns, or outcomes.',
      inputSchema: {
        type: 'object',
        properties: {
          content: { type: 'string', description: 'The memory content to store' },
          workspace: { type: 'string', description: 'Workspace: janus-ia | lool-ai | freelance-system | espacio-bosques | nutria | longevite | jp-ai | mercado-bot' },
          project: { type: 'string', description: 'Sub-project name if different from workspace (optional)' },
          type: {
            type: 'string',
            enum: ['session', 'decision', 'learning', 'outcome', 'correction', 'feedback', 'pattern'],
            description: 'session=conversation summary, decision=architectural/business choice, learning=what worked/failed, outcome=result or metric, correction=user corrected AI behavior, feedback=user preference or style guidance, pattern=cross-project recurring pattern',
            default: 'learning'
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Searchable tags (e.g. ["supabase", "rls", "security"])'
          },
          metadata: { type: 'object', description: 'Any extra structured data' }
        },
        required: ['content', 'workspace']
      }
    },
    {
      name: 'recall',
      description: 'Search memories across ALL workspaces and projects. Use at session start, before major decisions, and when the user asks "where did we leave off." Supports semantic search (if Voyage API is configured) with full-text fallback.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'What to search for — natural language works best' },
          workspace: { type: 'string', description: 'Limit to a specific workspace (optional)' },
          project: { type: 'string', description: 'Limit to a specific project (optional)' },
          type: { type: 'string', description: 'Limit to a memory type (optional)' },
          limit: { type: 'number', default: 10, description: 'Number of results (default 10)' }
        },
        required: ['query']
      }
    },
    {
      name: 'forget',
      description: 'Delete a specific memory by ID. Use when a memory is outdated, wrong, or superseded.',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'UUID of the memory to delete' }
        },
        required: ['id']
      }
    },
    {
      name: 'list_memories',
      description: 'List memories with optional filters. Use to audit what is stored, browse by type/workspace, or check for duplicates before storing new memories.',
      inputSchema: {
        type: 'object',
        properties: {
          workspace: { type: 'string', description: 'Filter by workspace' },
          project: { type: 'string', description: 'Filter by project' },
          type: { type: 'string', description: 'Filter by type' },
          limit: { type: 'number', default: 20, description: 'Number of results (default 20)' },
          offset: { type: 'number', default: 0, description: 'Offset for pagination' }
        }
      }
    },
    {
      name: 'capture_correction',
      description: 'Store a user correction as a structured memory. Use EVERY TIME the user corrects your approach, says "no not that", "don\'t do X", or redirects you. These are the highest-value memories.',
      inputSchema: {
        type: 'object',
        properties: {
          original: { type: 'string', description: 'What you did or were about to do' },
          correction: { type: 'string', description: 'What the user said to correct you' },
          context: { type: 'string', description: 'Why this correction matters — what was the user trying to achieve?' },
          workspace: { type: 'string', description: 'Current workspace' },
          project: { type: 'string', description: 'Current project (optional)' }
        },
        required: ['original', 'correction', 'context', 'workspace']
      }
    },
    {
      name: 'capture_session_summary',
      description: 'Store a comprehensive session summary. Call this at the END of every session to capture what happened.',
      inputSchema: {
        type: 'object',
        properties: {
          summary: { type: 'string', description: 'What was accomplished this session' },
          workspace: { type: 'string', description: 'Primary workspace' },
          projects_touched: {
            type: 'array',
            items: { type: 'string' },
            description: 'All projects that were worked on'
          },
          decisions: {
            type: 'array',
            items: { type: 'string' },
            description: 'Key decisions made (optional)'
          },
          learnings: {
            type: 'array',
            items: { type: 'string' },
            description: 'Things learned or discovered (optional)'
          },
          next_steps: {
            type: 'array',
            items: { type: 'string' },
            description: 'What should happen next session (optional)'
          },
          corrections: {
            type: 'array',
            items: { type: 'string' },
            description: 'User corrections received this session (optional)'
          }
        },
        required: ['summary', 'workspace', 'projects_touched']
      }
    }
  ]
}))

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  if (name === 'remember') {
    const { content, workspace, project = null, type = 'learning', tags = [], metadata = {} } = args
    const embedding = await generateEmbedding(content)
    const enrichedMetadata = { ...metadata, tags }

    const { data, error } = await supabase
      .from('memories')
      .insert({ content, workspace, project, type, metadata: enrichedMetadata, embedding })
      .select('id')
      .single()

    if (error) throw new Error(`Supabase insert error: ${error.message}`)

    const mode = embedding ? 'semantic' : 'text-search'
    return { content: [{ type: 'text', text: `Memory stored [${mode}] [${type}]: ${data.id}` }] }
  }

  if (name === 'recall') {
    const { query, workspace, project, type, limit = 10 } = args

    // Semantic search if embeddings are available
    if (VOYAGE_KEY) {
      const embedding = await generateEmbedding(query)
      if (embedding) {
        const { data, error } = await supabase.rpc('search_memories', {
          query_embedding: embedding,
          filter_workspace: workspace ?? null,
          filter_project: project ?? null,
          filter_type: type ?? null,
          match_count: limit
        })
        if (!error && data?.length) {
          return { content: [{ type: 'text', text: formatResults(data) }] }
        }
      }
    }

    // Full-text search fallback
    let q = supabase
      .from('memories')
      .select('id, workspace, project, type, content, created_at, metadata')
      .textSearch('content_tsv', query, { type: 'websearch', config: 'english' })
      .order('created_at', { ascending: false })
      .limit(limit)

    if (workspace) q = q.eq('workspace', workspace)
    if (project) q = q.eq('project', project)
    if (type) q = q.eq('type', type)

    const { data, error } = await q
    if (error) throw new Error(`Supabase search error: ${error.message}`)

    if (!data?.length) {
      // If text search returns nothing, try ilike as last resort
      let q2 = supabase
        .from('memories')
        .select('id, workspace, project, type, content, created_at, metadata')
        .ilike('content', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (workspace) q2 = q2.eq('workspace', workspace)
      if (project) q2 = q2.eq('project', project)
      if (type) q2 = q2.eq('type', type)

      const { data: data2, error: error2 } = await q2
      if (error2) throw new Error(`Supabase ilike error: ${error2.message}`)
      return { content: [{ type: 'text', text: formatResults(data2) }] }
    }

    return { content: [{ type: 'text', text: formatResults(data) }] }
  }

  if (name === 'forget') {
    const { id } = args

    // First fetch the memory so we can confirm what was deleted
    const { data: existing } = await supabase
      .from('memories')
      .select('id, workspace, type, content')
      .eq('id', id)
      .single()

    if (!existing) {
      return { content: [{ type: 'text', text: `Memory ${id} not found.` }] }
    }

    const { error } = await supabase
      .from('memories')
      .delete()
      .eq('id', id)

    if (error) throw new Error(`Supabase delete error: ${error.message}`)

    const preview = existing.content.substring(0, 100)
    return { content: [{ type: 'text', text: `Deleted memory ${id} [${existing.type}]: "${preview}..."` }] }
  }

  if (name === 'list_memories') {
    const { workspace, project, type, limit = 20, offset = 0 } = args

    let q = supabase
      .from('memories')
      .select('id, workspace, project, type, content, created_at, metadata')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (workspace) q = q.eq('workspace', workspace)
    if (project) q = q.eq('project', project)
    if (type) q = q.eq('type', type)

    const { data, error, count } = await q
    if (error) throw new Error(`Supabase list error: ${error.message}`)

    const header = `Showing ${data?.length ?? 0} memories (offset: ${offset})`
    return { content: [{ type: 'text', text: `${header}\n\n${formatResults(data)}` }] }
  }

  if (name === 'capture_correction') {
    const { original, correction, context, workspace, project = null } = args
    const content = `CORRECTION:\nOriginal behavior: ${original}\nUser said: ${correction}\nContext: ${context}\nRule: ${correction}`
    const embedding = await generateEmbedding(content)

    const { data, error } = await supabase
      .from('memories')
      .insert({
        content,
        workspace,
        project,
        type: 'correction',
        metadata: { tags: ['correction', 'user-feedback'], original, correction, context },
        embedding
      })
      .select('id')
      .single()

    if (error) throw new Error(`Supabase insert error: ${error.message}`)
    return { content: [{ type: 'text', text: `Correction captured: ${data.id}\nWill apply in future sessions.` }] }
  }

  if (name === 'capture_session_summary') {
    const { summary, workspace, projects_touched, decisions = [], learnings = [], next_steps = [], corrections = [] } = args

    const sections = [`SESSION SUMMARY: ${summary}`]
    if (projects_touched.length) sections.push(`Projects: ${projects_touched.join(', ')}`)
    if (decisions.length) sections.push(`Decisions:\n${decisions.map(d => `- ${d}`).join('\n')}`)
    if (learnings.length) sections.push(`Learnings:\n${learnings.map(l => `- ${l}`).join('\n')}`)
    if (next_steps.length) sections.push(`Next steps:\n${next_steps.map(n => `- ${n}`).join('\n')}`)
    if (corrections.length) sections.push(`Corrections received:\n${corrections.map(c => `- ${c}`).join('\n')}`)

    const content = sections.join('\n\n')
    const embedding = await generateEmbedding(content)

    const { data, error } = await supabase
      .from('memories')
      .insert({
        content,
        workspace,
        project: projects_touched[0] ?? null,
        type: 'session',
        metadata: { tags: ['session-summary'], projects_touched, decisions, learnings, next_steps, corrections },
        embedding
      })
      .select('id')
      .single()

    if (error) throw new Error(`Supabase insert error: ${error.message}`)
    return { content: [{ type: 'text', text: `Session summary stored: ${data.id}` }] }
  }

  throw new Error(`Unknown tool: ${name}`)
})

function formatResults(rows) {
  if (!rows?.length) return 'No memories found.'
  return rows.map(m => {
    const date = m.created_at?.split('T')[0] ?? '?'
    const loc = `${m.workspace}${m.project && m.project !== m.workspace ? '/' + m.project : ''}`
    const tags = m.metadata?.tags?.length ? ` [${m.metadata.tags.join(', ')}]` : ''
    const sim = m.similarity ? ` (${(m.similarity * 100).toFixed(0)}% match)` : ''
    const preview = m.content.length > 500 ? m.content.substring(0, 500) + '…' : m.content
    return `[${date}] [${loc}] [${m.type}]${tags}${sim}\nID: ${m.id}\n${preview}`
  }).join('\n\n---\n\n')
}

const transport = new StdioServerTransport()
await server.connect(transport)
