/**
 * Live market data service
 * Primary source: Polymarket Gamma API (public, no auth)
 * Secondary: Kalshi (requires API key in VITE_KALSHI_API_KEY)
 *
 * Both are proxied through Vite to avoid CORS.
 */

const POLY = '/proxy/polymarket'
const KALSHI = '/proxy/kalshi'

// Normalize a Polymarket gamma market to our internal schema
function normalizePoly(m) {
  const prices = JSON.parse(m.outcomePrices || '["0.5","0.5"]')
  const outcomes = JSON.parse(m.outcomes || '["Yes","No"]')
  const now = new Date()
  const end = new Date(m.endDate || m.end_date_iso || now)
  const daysLeft = Math.max(0, Math.ceil((end - now) / (1000 * 86400)))
  const yesPrice = parseFloat(prices[0])

  let resolution = null
  if (m.resolved) {
    resolution = yesPrice === 1 ? 'yes' : yesPrice === 0 ? 'no' : null
  }

  return {
    id: m.conditionId || m.id,
    polyId: m.id,         // UUID for single-market lookup
    title: m.question,
    pMarket: m.resolved ? (resolution === 'yes' ? 1 : 0) : yesPrice,
    vol: Math.round(parseFloat(m.volumeNum || m.volume || 0)),
    days: daysLeft,
    platform: 'polymarket',
    endDate: m.endDate || m.end_date_iso,
    resolved: !!m.resolved,
    resolution,           // 'yes' | 'no' | null
    outcomes,
  }
}

// Normalize a Kalshi market
function normalizeKalshi(m) {
  const now = new Date()
  const end = new Date(m.close_time || now)
  const daysLeft = Math.max(0, Math.ceil((end - now) / (1000 * 86400)))

  let resolution = null
  if (m.status === 'determined') {
    resolution = m.result === 'yes' ? 'yes' : 'no'
  }

  return {
    id: m.ticker,
    kalshiTicker: m.ticker,
    title: m.title,
    pMarket: (m.yes_bid + m.yes_ask) / 2 / 100, // cents → 0–1
    vol: m.volume || 0,
    days: daysLeft,
    platform: 'kalshi',
    endDate: m.close_time,
    resolved: m.status === 'determined',
    resolution,
  }
}

/**
 * Fetch live markets from Polymarket.
 * Filters: binary, active, price 5%–95%, volume > $1k, 1–90 days out.
 */
export async function fetchPolymarkets(limit = 20) {
  const resp = await fetch(
    `${POLY}/markets?active=true&closed=false&limit=100&order=volume&ascending=false`
  )
  if (!resp.ok) throw new Error(`Polymarket ${resp.status}`)
  const data = await resp.json()

  const now = new Date()

  return data
    .filter(m => {
      if (!m.active || m.closed || !m.endDate) return false
      const outcomes = JSON.parse(m.outcomes || '[]')
      if (outcomes.length !== 2) return false           // binary only
      const prices = JSON.parse(m.outcomePrices || '[]')
      const yesPrice = parseFloat(prices[0])
      if (isNaN(yesPrice) || yesPrice < 0.05 || yesPrice > 0.95) return false
      const daysLeft = (new Date(m.endDate) - now) / (1000 * 86400)
      if (daysLeft < 1 || daysLeft > 90) return false
      const vol = parseFloat(m.volumeNum || m.volume || 0)
      if (vol < 1000) return false
      return true
    })
    .slice(0, limit)
    .map(normalizePoly)
}

/**
 * Fetch open Kalshi markets.
 * Requires VITE_KALSHI_API_KEY — skipped if missing.
 */
export async function fetchKalshiMarkets(limit = 10) {
  const key = import.meta.env.VITE_KALSHI_API_KEY
  if (!key) return []

  const resp = await fetch(
    `${KALSHI}/trade-api/v2/markets?status=open&limit=100`,
    { headers: { Authorization: `Bearer ${key}` } }
  )
  if (!resp.ok) throw new Error(`Kalshi ${resp.status}`)
  const { markets } = await resp.json()

  return (markets || [])
    .filter(m => {
      if (!m.yes_bid || !m.yes_ask) return false
      const midPrice = (m.yes_bid + m.yes_ask) / 2 / 100
      return midPrice >= 0.05 && midPrice <= 0.95 && m.volume > 100
    })
    .slice(0, limit)
    .map(normalizeKalshi)
}

/**
 * Fetch all live markets (Polymarket + Kalshi).
 * Falls back to MOCK_MARKETS if both fail.
 */
export async function fetchLiveMarkets() {
  const results = await Promise.allSettled([
    fetchPolymarkets(15),
    fetchKalshiMarkets(5),
  ])

  const poly  = results[0].status === 'fulfilled' ? results[0].value : []
  const kalsh = results[1].status === 'fulfilled' ? results[1].value : []

  const combined = [...poly, ...kalsh]
  if (combined.length === 0) throw new Error('both APIs failed')

  return combined
}

/**
 * Check resolution status of a single Polymarket market by its UUID.
 * Returns 'yes' | 'no' | null (null = still open or indeterminate).
 */
export async function checkPolyResolution(polyId) {
  try {
    const resp = await fetch(`${POLY}/markets/${polyId}`)
    if (!resp.ok) return null
    const m = await resp.json()
    if (!m.resolved) return null
    const prices = JSON.parse(m.outcomePrices || '[]')
    const yesPrice = parseFloat(prices[0])
    if (yesPrice === 1) return 'yes'
    if (yesPrice === 0) return 'no'
    return null
  } catch {
    return null
  }
}

/**
 * Check resolution status of a Kalshi market by ticker.
 */
export async function checkKalshiResolution(ticker) {
  const key = import.meta.env.VITE_KALSHI_API_KEY
  if (!key) return null
  try {
    const resp = await fetch(`${KALSHI}/trade-api/v2/markets/${ticker}`, {
      headers: { Authorization: `Bearer ${key}` },
    })
    if (!resp.ok) return null
    const { market } = await resp.json()
    if (market.status !== 'determined') return null
    return market.result === 'yes' ? 'yes' : 'no'
  } catch {
    return null
  }
}
