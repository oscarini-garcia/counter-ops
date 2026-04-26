const TAUNTS = [
  "Another one? Bold.",
  "No one can stop you.",
  "Legend.",
  "Scientists are taking notes.",
  "Your family is watching.",
  "Statistically alarming.",
  "This is fine. 🔥",
  "The record books tremble.",
  "Peak holiday energy.",
  "Zero regrets detected.",
]

export function getRandomTaunt() {
  return TAUNTS[Math.floor(Math.random() * TAUNTS.length)]
}

// Daily champion: most consumed today
export function getChampion(entries) {
  const today = new Date().toDateString()
  const todayEntries = entries.filter(e => new Date(e.timestamp).toDateString() === today)
  if (todayEntries.length === 0) return null

  const totals = {}
  for (const e of todayEntries) {
    totals[e.member] = (totals[e.member] || 0) + (e.qty || 1)
  }
  const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1])
  if (sorted.length === 0) return null
  return { memberId: sorted[0][0], total: sorted[0][1] }
}

// Donkey: least consumed overall (among members who have at least 1 entry)
export function getDonkey(entries, members) {
  if (members.length < 2) return null
  const totals = {}
  for (const m of members) totals[m.id] = 0
  for (const e of entries) {
    if (totals[e.member] !== undefined) totals[e.member] += (e.qty || 1)
  }
  const active = Object.entries(totals).filter(([, t]) => t > 0)
  if (active.length < 2) return null
  const sorted = active.sort((a, b) => a[1] - b[1])
  return { memberId: sorted[0][0], total: sorted[0][1] }
}

// Streaks: consecutive days with at least 1 entry per member per counter
export function getStreaks(entries) {
  // Returns { [memberId]: { days, counter } } for the longest active streak per member
  const byMemberCounter = {}
  for (const e of entries) {
    const key = `${e.member}__${e.counter}`
    if (!byMemberCounter[key]) byMemberCounter[key] = new Set()
    byMemberCounter[key].add(new Date(e.timestamp).toDateString())
  }

  const result = {}
  for (const [key, days] of Object.entries(byMemberCounter)) {
    const [memberId, counterId] = key.split('__')
    const sorted = Array.from(days).sort()
    let streak = 1
    let maxStreak = 1
    for (let i = sorted.length - 1; i > 0; i--) {
      const diff = (new Date(sorted[i]) - new Date(sorted[i - 1])) / 86400000
      if (diff === 1) streak++
      else break
    }
    // Only show if streak includes today or yesterday
    const last = new Date(sorted[sorted.length - 1])
    const now = new Date()
    const diffFromNow = Math.floor((now - last) / 86400000)
    if (diffFromNow > 1) continue
    if (streak >= 2 && (!result[memberId] || result[memberId].days < streak)) {
      result[memberId] = { days: streak, counter: counterId }
    }
  }
  return result
}

export const MILESTONES = [10, 25, 50, 100, 200]

export function checkMilestones(entries, counters, milestonesFired = []) {
  const triggered = []
  for (const counter of counters) {
    const total = entries.filter(e => e.counter === counter.id).reduce((s, e) => s + (e.qty || 1), 0)
    for (const threshold of MILESTONES) {
      const key = `${counter.id}_${threshold}`
      if (total >= threshold && !milestonesFired.includes(key)) {
        triggered.push({ key, counter, threshold })
      }
    }
  }
  return triggered
}
