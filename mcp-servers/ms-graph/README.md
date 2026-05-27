# Microsoft Graph (Outlook) MCP

Read + send Microsoft 365 mail (work `@morsco.com` inbox) from Janus IA.

## Prerequisites — you need 4 env vars in dotfiles

```env
export MS_TENANT_ID="<entra-tenant-guid-or-domain>"
export MS_CLIENT_ID="<azure-ad-app-registration-client-id>"
export MS_CLIENT_SECRET="<client-secret-if-confidential-client>"   # optional for public clients
export MS_REFRESH_TOKEN="<oauth2-refresh-token-with-mail.read-mail.send-scopes>"
```

These come from an **Azure AD app registration** in Reece's Entra ID tenant.
At Reece scale that registration almost always requires IT approval — see
the IT ticket template below.

## Once you have the credentials

1. Paste the 4 `export` lines into `~/dotfiles/.env`.
2. The `.mcp.json` entry is already wired (see snippet I gave you).
3. Restart Janus IA → the `ms-graph` MCP spawns automatically.
4. Tools available:
   - `list_recent_emails(folder?, limit?, unreadOnly?)`
   - `search_emails(query, limit?)` — KQL syntax
   - `get_email(messageId)`
   - `send_email(to, subject, body, bodyType?, cc?, bcc?)`
   - `reply_to_email(messageId, body, replyAll?, bodyType?)`
   - `list_folders()`

## IT ticket template (paste into Reece helpdesk)

> **Subject:** App registration request — personal mailbox automation via Microsoft Graph
>
> Hi,
>
> I'd like to set up programmatic read/send access to **my own
> `alejandro.salas@morsco.com` mailbox** for personal productivity automation
> (triaging tickets, drafting replies, summarizing threads). To do this I need:
>
> 1. An **Azure AD app registration** in Reece's tenant — name suggestion:
>    `salas-personal-mail-assistant` (or whatever your naming convention is).
> 2. **Delegated permissions** on Microsoft Graph (NOT application
>    permissions — these are scoped to my account only, no tenant-wide access):
>    - `Mail.Read`
>    - `Mail.Send`
>    - `User.Read`
>    - `offline_access` (so the refresh token persists)
> 3. **Admin consent** granted on those delegated scopes.
> 4. A redirect URI of `http://localhost:8080/callback` for the one-time
>    authorization-code OAuth handshake.
> 5. The resulting `client_id` and `tenant_id` returned to me (a client
>    secret is optional — I can use a public-client flow if your policy
>    prefers it).
>
> This is the same shape of access used by standard email-integration tools
> (e.g., Outlook mobile, Teams). Conditional Access policies on my account
> apply as normal — the app cannot bypass them. The token only works for my
> mailbox; the app has no access to anyone else's data.
>
> Happy to provide more detail or hop on a call. Thanks!

## Getting the refresh token after IT approves

Once Reece IT gives you the `client_id` + `tenant_id`, run a one-time OAuth
authorization-code flow to mint the refresh token. Easiest path:

1. Install the Microsoft Identity sample CLI or use a small script (I can
   write one once you have the IDs — needs the actual values).
2. Visit `https://login.microsoftonline.com/<TENANT_ID>/oauth2/v2.0/authorize?client_id=<CLIENT_ID>&response_type=code&redirect_uri=http://localhost:8080/callback&scope=https://graph.microsoft.com/Mail.Read%20https://graph.microsoft.com/Mail.Send%20offline_access&response_mode=query`
3. Sign in (Okta will redirect — that's expected; same flow as Outlook.com).
4. Capture the `code` from the redirect URL.
5. POST it to `https://login.microsoftonline.com/<TENANT_ID>/oauth2/v2.0/token` to exchange for `access_token` + `refresh_token`.
6. Save the `refresh_token` as `MS_REFRESH_TOKEN` in dotfiles.

The refresh token typically lasts 90 days, sliding window. The MCP server
auto-refreshes the access token on each call.

## Troubleshooting

- `AADSTS50105: app role not assigned` → admin consent didn't go through; IT needs to grant it.
- `AADSTS65001: user did not consent` → first-time authorization flow wasn't completed; redo step 2 above.
- `Conditional Access: device must be compliant` → your machine isn't enrolled in Intune; talk to IT about a CA policy exception for this app, OR use this only from a Reece-managed device.
- `Mailbox not found` → check that `https://outlook.office.com` loads your mail; if not, you might be on a hybrid Exchange setup that needs a different endpoint.
