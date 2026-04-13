export function fullKelly(p, b) {
  return (p * b - (1 - p)) / b
}

export function oddsFromPrice(pMarket) {
  return (1 / pMarket) - 1
}

export function kellyPositionSize(p, pMarket, bankroll, fractional = 0.25, maxPct = 0.05) {
  const b = oddsFromPrice(pMarket)
  const fStar = fullKelly(p, b)
  if (fStar <= 0) return { size: 0, fStar, b, ev: p * b - (1 - p), approved: false }
  const size = Math.min(fractional * fStar * bankroll, maxPct * bankroll)
  const ev = p * b - (1 - p)
  return { size: +size.toFixed(2), fStar: +fStar.toFixed(4), b: +b.toFixed(4), ev: +ev.toFixed(4), approved: ev > 0 }
}

export function generateHistory(n = 28, startVal = 500) {
  const now = new Date()
  const results = []
  let val = startVal
  for (let i = n - 1; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 3600 * 1000)
    const hh = t.getHours().toString().padStart(2, '0')
    // small random walk with slight downward drift to start at approx startVal
    const delta = (Math.random() - 0.52) * 6
    val = Math.max(480, Math.min(520, val + delta))
    results.push({ t: `${hh}:00`, v: +val.toFixed(2) })
  }
  // ensure last point is exactly startVal
  results[results.length - 1].v = startVal
  return results
}
