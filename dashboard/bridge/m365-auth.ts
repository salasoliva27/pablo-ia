// Microsoft 365 / Graph OAuth — device-code flow.
//
// Why device-code: works without a registered redirect URI and gives the user
// a normal Microsoft login page in their own browser (MFA, conditional access,
// tenant policy all enforced server-side). The bridge never sees the password.
//
// Client ID: uses Microsoft's well-known Graph Explorer multi-tenant app
// (`14d82eec-204b-4c2f-b7e8-296a70dab67e`) by default. If the user's tenant
// admin has blocked unmanaged apps, the consent step will fail with
// AADSTS65001 / AADSTS50105 / AADSTS900971 — that's the dead-end we tell the
// user about upfront. They can override by setting MS_GRAPH_CLIENT_ID +
// MS_GRAPH_TENANT_ID for a tenant-registered app.
//
// Token storage: in-memory while the bridge is alive; refresh token persisted
// to dotfiles via the existing /api/credentials/save flow so it survives
// restarts. Access token is short-lived (1h) and refreshed on demand.

import { readVarFromDotfiles } from "./agent-registry.js";

const GRAPH_EXPLORER_CLIENT_ID = "14d82eec-204b-4c2f-b7e8-296a70dab67e";
const DEFAULT_TENANT = "common"; // multi-tenant + personal accounts

// Scopes we request. `offline_access` is required for a refresh token. The
// rest cover the four pillars the user asked about: mail, calendar, Teams
// chat/channels, files. Write scopes included — if the tenant blocks any one
// of them, the whole consent fails and we'll know to fall back to read-only.
const DEFAULT_SCOPES = [
  "offline_access",
  "openid",
  "profile",
  "User.Read",
  "Mail.ReadWrite",
  "Mail.Send",
  "Calendars.ReadWrite",
  "Chat.ReadWrite",
  "ChannelMessage.Send",
  "ChannelMessage.Read.All",
  "Files.ReadWrite.All",
];

const READ_ONLY_SCOPES = [
  "offline_access",
  "openid",
  "profile",
  "User.Read",
  "Mail.Read",
  "Calendars.Read",
  "Chat.Read",
  "ChannelMessage.Read.All",
  "Files.Read.All",
];

function envOrDotfile(name: string): string {
  const v = process.env[name];
  if (typeof v === "string" && v.length > 0) return v;
  return readVarFromDotfiles(name) ?? "";
}

function clientId(): string {
  return envOrDotfile("MS_GRAPH_CLIENT_ID") || GRAPH_EXPLORER_CLIENT_ID;
}

function tenant(): string {
  return envOrDotfile("MS_GRAPH_TENANT_ID") || DEFAULT_TENANT;
}

function authority(): string {
  return `https://login.microsoftonline.com/${encodeURIComponent(tenant())}`;
}

interface DeviceCodeResponse {
  user_code: string;
  device_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
  message: string;
}

interface TokenResponse {
  token_type: string;
  scope: string;
  expires_in: number;
  ext_expires_in?: number;
  access_token: string;
  refresh_token?: string;
  id_token?: string;
}

interface ErrorResponse {
  error: string;
  error_description?: string;
  error_codes?: number[];
  suberror?: string;
}

interface PendingDeviceFlow {
  deviceCode: string;
  userCode: string;
  verificationUri: string;
  startedAt: number;
  expiresAt: number;
  interval: number;
  scopeSet: "full" | "read";
  // Set once the user completes auth (or it errors). Latest call to
  // pollDeviceFlow() drives this — front-end polls our /status endpoint.
  result:
    | { state: "pending" }
    | { state: "ok"; account: string | null; expiresAt: number }
    | { state: "error"; error: string; description: string };
}

interface TokenState {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // epoch ms
  scope: string;
  account: string | null;
}

let pending: PendingDeviceFlow | null = null;
let tokens: TokenState | null = null;

// On boot, try to rehydrate from dotfile refresh token. If it's there, an
// access token will be minted on first call to getAccessToken().
(function hydrateFromDotfile() {
  const rt = envOrDotfile("MS_GRAPH_REFRESH_TOKEN");
  if (!rt) return;
  tokens = {
    accessToken: "",
    refreshToken: rt,
    expiresAt: 0,
    scope: envOrDotfile("MS_GRAPH_SCOPE") || "",
    account: envOrDotfile("MS_GRAPH_ACCOUNT") || null,
  };
  console.log("[m365] refresh token loaded from dotfiles — will mint access token on demand");
})();

export interface ConnectInit {
  verificationUri: string;
  userCode: string;
  expiresIn: number;
  message: string;
}

export async function startDeviceFlow(opts?: { scope?: "full" | "read" }): Promise<ConnectInit> {
  const scopeSet = opts?.scope ?? "full";
  const scopes = scopeSet === "read" ? READ_ONLY_SCOPES : DEFAULT_SCOPES;
  const url = `${authority()}/oauth2/v2.0/devicecode`;
  const body = new URLSearchParams({
    client_id: clientId(),
    scope: scopes.join(" "),
  });
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = (await r.json()) as DeviceCodeResponse | ErrorResponse;
  if (!r.ok || "error" in data) {
    const err = data as ErrorResponse;
    throw new Error(`device-code request failed: ${err.error} — ${err.error_description ?? ""}`);
  }
  const dc = data as DeviceCodeResponse;
  pending = {
    deviceCode: dc.device_code,
    userCode: dc.user_code,
    verificationUri: dc.verification_uri,
    startedAt: Date.now(),
    expiresAt: Date.now() + dc.expires_in * 1000,
    interval: Math.max(1, dc.interval),
    scopeSet,
    result: { state: "pending" },
  };
  console.log(`[m365] device flow started — code ${dc.user_code} at ${dc.verification_uri}`);
  return {
    verificationUri: dc.verification_uri,
    userCode: dc.user_code,
    expiresIn: dc.expires_in,
    message: dc.message,
  };
}

// Single poll. Front-end calls /api/m365/poll on its own schedule so we don't
// keep a background timer alive forever — once the user completes auth (or
// gives up), the front-end stops polling.
export async function pollDeviceFlow(): Promise<PendingDeviceFlow["result"]> {
  if (!pending) return { state: "error", error: "no_flow", description: "Call startDeviceFlow first" };
  if (pending.result.state !== "pending") return pending.result;
  if (Date.now() > pending.expiresAt) {
    pending.result = { state: "error", error: "expired", description: "Device code expired — start over" };
    return pending.result;
  }
  const url = `${authority()}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:device_code",
    client_id: clientId(),
    device_code: pending.deviceCode,
  });
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = (await r.json()) as TokenResponse | ErrorResponse;
  if (!r.ok || "error" in data) {
    const err = data as ErrorResponse;
    // authorization_pending and slow_down are *expected* — user hasn't
    // finished yet. Stay in pending state.
    if (err.error === "authorization_pending" || err.error === "slow_down") {
      return { state: "pending" };
    }
    // Everything else is terminal.
    pending.result = {
      state: "error",
      error: err.error,
      description: err.error_description ?? "(no description)",
    };
    return pending.result;
  }
  const tok = data as TokenResponse;
  const account = decodeAccount(tok.id_token);
  tokens = {
    accessToken: tok.access_token,
    refreshToken: tok.refresh_token ?? "",
    expiresAt: Date.now() + tok.expires_in * 1000,
    scope: tok.scope ?? "",
    account,
  };
  pending.result = { state: "ok", account, expiresAt: tokens.expiresAt };
  console.log(`[m365] token acquired for ${account ?? "(unknown)"}`);
  return pending.result;
}

function decodeAccount(idToken: string | undefined): string | null {
  if (!idToken) return null;
  try {
    const parts = idToken.split(".");
    if (parts.length < 2) return null;
    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
    return (payload.preferred_username as string) || (payload.email as string) || (payload.upn as string) || null;
  } catch {
    return null;
  }
}

export async function refreshIfNeeded(): Promise<string | null> {
  if (!tokens || !tokens.refreshToken) return null;
  // Refresh if access token is empty or within 60s of expiry.
  if (tokens.accessToken && Date.now() < tokens.expiresAt - 60_000) {
    return tokens.accessToken;
  }
  const url = `${authority()}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: clientId(),
    refresh_token: tokens.refreshToken,
  });
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = (await r.json()) as TokenResponse | ErrorResponse;
  if (!r.ok || "error" in data) {
    const err = data as ErrorResponse;
    console.error(`[m365] refresh failed: ${err.error} — ${err.error_description}`);
    // Hard error like invalid_grant means refresh token revoked. Clear state
    // so the UI shows "not connected" and the user can re-auth.
    if (err.error === "invalid_grant") {
      tokens = null;
    }
    return null;
  }
  const tok = data as TokenResponse;
  tokens = {
    accessToken: tok.access_token,
    refreshToken: tok.refresh_token ?? tokens.refreshToken,
    expiresAt: Date.now() + tok.expires_in * 1000,
    scope: tok.scope ?? tokens.scope,
    account: tokens.account,
  };
  return tokens.accessToken;
}

export interface M365Status {
  connected: boolean;
  account: string | null;
  scope: string;
  expiresAt: number | null;
  pendingFlow: {
    userCode: string;
    verificationUri: string;
    expiresAt: number;
    result: PendingDeviceFlow["result"];
  } | null;
  clientId: string;
  tenant: string;
}

export function getStatus(): M365Status {
  return {
    connected: !!tokens?.refreshToken,
    account: tokens?.account ?? null,
    scope: tokens?.scope ?? "",
    expiresAt: tokens?.expiresAt ?? null,
    pendingFlow: pending
      ? {
          userCode: pending.userCode,
          verificationUri: pending.verificationUri,
          expiresAt: pending.expiresAt,
          result: pending.result,
        }
      : null,
    clientId: clientId(),
    tenant: tenant(),
  };
}

export function getRefreshTokenForPersistence(): string | null {
  return tokens?.refreshToken ?? null;
}

export function getAccountForPersistence(): string | null {
  return tokens?.account ?? null;
}

export function getScopeForPersistence(): string | null {
  return tokens?.scope ?? null;
}

export function disconnect(): void {
  tokens = null;
  pending = null;
}

// Helper for downstream pollers (mail, calendar, teams) once we wire them.
// Returns a valid access token or null if the bridge isn't connected.
export async function getAccessToken(): Promise<string | null> {
  return refreshIfNeeded();
}
