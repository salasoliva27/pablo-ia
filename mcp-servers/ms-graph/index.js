#!/usr/bin/env node
/**
 * Janus IA — Microsoft Graph (Outlook) MCP Server
 *
 * Read + send mail for the user's Microsoft 365 mailbox (typically work
 * email). Authentication: OAuth2 authorization-code flow with refresh token.
 * Credentials live in dotfiles:
 *
 *   MS_TENANT_ID      — Entra ID tenant (organization GUID, or "common" for
 *                       multi-tenant apps)
 *   MS_CLIENT_ID      — Azure AD app registration's Application (client) ID
 *   MS_CLIENT_SECRET  — Client secret value (optional for public clients;
 *                       required for confidential clients)
 *   MS_REFRESH_TOKEN  — Long-lived refresh token obtained via the
 *                       authorization-code flow with offline_access scope
 *
 * Tools:
 *   list_recent_emails(folder?, limit?)
 *   search_emails(query, folder?, limit?)
 *   get_email(messageId)
 *   send_email(to, subject, body, cc?, bcc?)
 *   reply_to_email(messageId, body, replyAll?)
 *   list_folders()
 *
 * All calls scoped to /me — i.e. the mailbox of the user whose refresh
 * token is loaded. The MCP cannot access other users' mailboxes.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'

const TENANT_ID = process.env.MS_TENANT_ID
const CLIENT_ID = process.env.MS_CLIENT_ID
const CLIENT_SECRET = process.env.MS_CLIENT_SECRET // optional for public-client app
const REFRESH_TOKEN = process.env.MS_REFRESH_TOKEN

if (!TENANT_ID || !CLIENT_ID || !REFRESH_TOKEN) {
  console.error('[ms-graph] missing MS_TENANT_ID / MS_CLIENT_ID / MS_REFRESH_TOKEN — exiting')
  process.exit(1)
}

const GRAPH = 'https://graph.microsoft.com/v1.0'

// In-memory access token cache. Refresh tokens last ~90 days; access tokens
// last ~1 hour. We refresh on demand and cache the access token until the
// expiry hint suggests it's about to die.
let cachedAccessToken = null
let cachedExpiresAt = 0

async function getAccessToken() {
  if (cachedAccessToken && Date.now() < cachedExpiresAt - 60_000) {
    return cachedAccessToken
  }
  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: 'refresh_token',
    refresh_token: REFRESH_TOKEN,
    scope: 'https://graph.microsoft.com/.default offline_access',
  })
  if (CLIENT_SECRET) body.set('client_secret', CLIENT_SECRET)
  const res = await fetch(`https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`MS token refresh failed (${res.status}): ${text.slice(0, 400)}`)
  }
  const data = await res.json()
  cachedAccessToken = data.access_token
  cachedExpiresAt = Date.now() + (data.expires_in * 1000)
  return cachedAccessToken
}

async function graph(path, init = {}) {
  const token = await getAccessToken()
  const url = path.startsWith('http') ? path : `${GRAPH}${path}`
  const res = await fetch(url, {
    ...init,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(init.headers || {}),
    },
  })
  const text = await res.text()
  if (!res.ok) {
    throw new Error(`Graph ${init.method || 'GET'} ${path} failed (${res.status}): ${text.slice(0, 400)}`)
  }
  return text ? JSON.parse(text) : null
}

function summarizeMessage(m) {
  return {
    id: m.id,
    receivedDateTime: m.receivedDateTime,
    subject: m.subject,
    from: m.from?.emailAddress?.address,
    fromName: m.from?.emailAddress?.name,
    to: (m.toRecipients || []).map(r => r.emailAddress?.address).filter(Boolean),
    cc: (m.ccRecipients || []).map(r => r.emailAddress?.address).filter(Boolean),
    isRead: m.isRead,
    hasAttachments: m.hasAttachments,
    bodyPreview: m.bodyPreview,
    webLink: m.webLink,
  }
}

const server = new Server(
  { name: 'janus-ms-graph', version: '1.0.0' },
  { capabilities: { tools: {} } }
)

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'list_recent_emails',
      description: 'List recent emails from a folder (default: Inbox). Returns metadata + bodyPreview; use get_email for full content.',
      inputSchema: {
        type: 'object',
        properties: {
          folder: { type: 'string', description: 'Folder display name (Inbox, Sent Items, Drafts, etc.) or Graph well-known name. Default: Inbox.' },
          limit: { type: 'number', description: 'Max results (default 20, cap 100).' },
          unreadOnly: { type: 'boolean', description: 'If true, only return unread.' },
        },
      },
    },
    {
      name: 'search_emails',
      description: 'Search the mailbox with Microsoft Search (KQL-style query). Examples: `from:alice@x.com`, `subject:"invoice" received>=2026-05-01`, `hasAttachment:true`.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'KQL search query.' },
          limit: { type: 'number', description: 'Max results (default 20, cap 100).' },
        },
        required: ['query'],
      },
    },
    {
      name: 'get_email',
      description: 'Fetch the full email body + headers by messageId. Returns HTML + text content.',
      inputSchema: {
        type: 'object',
        properties: {
          messageId: { type: 'string', description: 'Graph message id from list_recent_emails / search_emails.' },
        },
        required: ['messageId'],
      },
    },
    {
      name: 'send_email',
      description: 'Send a new email from the authenticated mailbox.',
      inputSchema: {
        type: 'object',
        properties: {
          to: { type: 'array', items: { type: 'string' }, description: 'Recipient addresses.' },
          subject: { type: 'string' },
          body: { type: 'string', description: 'Email body. Plain text unless bodyType=html.' },
          bodyType: { type: 'string', enum: ['text', 'html'], default: 'text' },
          cc: { type: 'array', items: { type: 'string' } },
          bcc: { type: 'array', items: { type: 'string' } },
        },
        required: ['to', 'subject', 'body'],
      },
    },
    {
      name: 'reply_to_email',
      description: 'Reply to an email by messageId. Set replyAll=true to include all original recipients.',
      inputSchema: {
        type: 'object',
        properties: {
          messageId: { type: 'string' },
          body: { type: 'string' },
          bodyType: { type: 'string', enum: ['text', 'html'], default: 'text' },
          replyAll: { type: 'boolean', default: false },
        },
        required: ['messageId', 'body'],
      },
    },
    {
      name: 'list_folders',
      description: 'List top-level mail folders + their item/unread counts.',
      inputSchema: { type: 'object', properties: {} },
    },
  ],
}))

async function handleTool(name, args) {
  if (name === 'list_recent_emails') {
    const limit = Math.min(args?.limit ?? 20, 100)
    const folder = args?.folder
    const unreadFilter = args?.unreadOnly ? `&$filter=isRead eq false` : ''
    const select = '$select=id,subject,from,toRecipients,ccRecipients,receivedDateTime,isRead,hasAttachments,bodyPreview,webLink'
    const order = '$orderby=receivedDateTime desc'
    const path = folder
      ? `/me/mailFolders/${encodeURIComponent(folder)}/messages?${select}&${order}&$top=${limit}${unreadFilter}`
      : `/me/messages?${select}&${order}&$top=${limit}${unreadFilter}`
    const data = await graph(path)
    const messages = (data.value || []).map(summarizeMessage)
    return { content: [{ type: 'text', text: JSON.stringify({ count: messages.length, messages }, null, 2) }] }
  }

  if (name === 'search_emails') {
    const limit = Math.min(args?.limit ?? 20, 100)
    const select = '$select=id,subject,from,toRecipients,ccRecipients,receivedDateTime,isRead,hasAttachments,bodyPreview,webLink'
    const path = `/me/messages?${select}&$search=${encodeURIComponent('"' + args.query + '"')}&$top=${limit}`
    const data = await graph(path, { headers: { 'ConsistencyLevel': 'eventual' } })
    const messages = (data.value || []).map(summarizeMessage)
    return { content: [{ type: 'text', text: JSON.stringify({ count: messages.length, messages }, null, 2) }] }
  }

  if (name === 'get_email') {
    const m = await graph(`/me/messages/${encodeURIComponent(args.messageId)}`)
    const summary = {
      ...summarizeMessage(m),
      body: m.body?.content,
      bodyType: m.body?.contentType,
      conversationId: m.conversationId,
    }
    return { content: [{ type: 'text', text: JSON.stringify(summary, null, 2) }] }
  }

  if (name === 'send_email') {
    const { to, subject, body, bodyType = 'text', cc = [], bcc = [] } = args
    const payload = {
      message: {
        subject,
        body: { contentType: bodyType, content: body },
        toRecipients: to.map(a => ({ emailAddress: { address: a } })),
        ccRecipients: cc.map(a => ({ emailAddress: { address: a } })),
        bccRecipients: bcc.map(a => ({ emailAddress: { address: a } })),
      },
      saveToSentItems: true,
    }
    await graph(`/me/sendMail`, { method: 'POST', body: JSON.stringify(payload) })
    return { content: [{ type: 'text', text: `Sent to ${to.join(', ')} — subject "${subject}"` }] }
  }

  if (name === 'reply_to_email') {
    const { messageId, body, bodyType = 'text', replyAll = false } = args
    const endpoint = replyAll ? 'replyAll' : 'reply'
    const payload = {
      comment: bodyType === 'html' ? undefined : body,
      message: bodyType === 'html'
        ? { body: { contentType: 'html', content: body } }
        : undefined,
    }
    await graph(`/me/messages/${encodeURIComponent(messageId)}/${endpoint}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    return { content: [{ type: 'text', text: `${replyAll ? 'Reply-all' : 'Reply'} sent on message ${messageId.slice(0, 12)}…` }] }
  }

  if (name === 'list_folders') {
    const data = await graph(`/me/mailFolders?$top=50`)
    const folders = (data.value || []).map(f => ({
      id: f.id,
      displayName: f.displayName,
      totalItemCount: f.totalItemCount,
      unreadItemCount: f.unreadItemCount,
    }))
    return { content: [{ type: 'text', text: JSON.stringify(folders, null, 2) }] }
  }

  throw new Error(`Unknown tool: ${name}`)
}

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  try {
    return await handleTool(req.params.name, req.params.arguments || {})
  } catch (err) {
    return { content: [{ type: 'text', text: `error: ${err.message || err}` }], isError: true }
  }
})

const transport = new StdioServerTransport()
await server.connect(transport)
console.error('[ms-graph] MCP server listening on stdio')
