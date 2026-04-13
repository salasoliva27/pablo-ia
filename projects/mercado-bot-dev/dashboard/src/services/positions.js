/**
 * Paper positions — persisted in localStorage.
 * These are real paper trades waiting for real market resolution.
 *
 * Position schema:
 * {
 *   id: uuid,
 *   marketId: string,       // platform market ID
 *   polyId: string | null,  // Polymarket UUID for resolution lookup
 *   kalshiTicker: string | null,
 *   platform: 'polymarket' | 'kalshi',
 *   title: string,
 *   direction: 'yes' | 'no',
 *   pModel: number,         // Claude's estimated probability
 *   pMarket: number,        // market price at time of bet
 *   size: number,           // dollars bet
 *   edge: number,
 *   endDate: string,        // market resolution date
 *   openedAt: string,       // ISO timestamp
 *   resolved: boolean,
 *   outcome: 'yes'|'no'|null,
 *   pnl: number | null,     // realized when resolved
 *   resolvedAt: string | null,
 * }
 */

const KEY = 'mercado_bot_positions_v1'

export function getPositions() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

export function savePosition(pos) {
  const positions = getPositions()
  const newPos = {
    ...pos,
    id: crypto.randomUUID(),
    openedAt: new Date().toISOString(),
    resolved: false,
    outcome: null,
    pnl: null,
    resolvedAt: null,
  }
  positions.unshift(newPos)
  localStorage.setItem(KEY, JSON.stringify(positions))
  return newPos
}

export function resolvePosition(id, outcome, pnl) {
  const positions = getPositions()
  const idx = positions.findIndex(p => p.id === id)
  if (idx >= 0) {
    positions[idx] = {
      ...positions[idx],
      resolved: true,
      outcome,
      pnl,
      resolvedAt: new Date().toISOString(),
    }
    localStorage.setItem(KEY, JSON.stringify(positions))
  }
  return positions
}

export function clearPositions() {
  localStorage.removeItem(KEY)
}

/** Calculate real P&L when a position resolves */
export function calcResolutionPnl(position, outcome) {
  const { direction, size, pMarket } = position
  const betWon = direction === outcome
  if (betWon) {
    // payout = size * (1/price - 1) * 0.9 (10% rake simulation)
    return +(size * ((1 / pMarket) - 1) * 0.9).toFixed(2)
  }
  return -size
}
