export function generateAwards(entries, members) {
  if (!entries.length || !members.length) return []

  const awards = []

  // 🥇 Most Consistent — logged every day of the trip
  const days = new Set(entries.map(e => new Date(e.timestamp).toDateString()))
  const totalDays = days.size
  if (totalDays >= 2) {
    const memberDays = {}
    for (const e of entries) {
      if (!memberDays[e.member]) memberDays[e.member] = new Set()
      memberDays[e.member].add(new Date(e.timestamp).toDateString())
    }
    const consistent = Object.entries(memberDays).filter(([, d]) => d.size === totalDays)
    if (consistent.length > 0) {
      const winnerId = consistent[0][0]
      const winner = members.find(m => m.id === winnerId)
      awards.push({ emoji: '🥇', title: 'Most Consistent', winner: winner?.name ?? winnerId, detail: `Logged every day of the trip` })
    }
  }

  // 💥 Biggest Single Day
  const byDay = {}
  for (const e of entries) {
    const day = new Date(e.timestamp).toDateString()
    const key = `${e.member}__${day}`
    byDay[key] = (byDay[key] || 0) + (e.qty || 1)
  }
  const bigDay = Object.entries(byDay).sort((a, b) => b[1] - a[1])[0]
  if (bigDay) {
    const [key, total] = bigDay
    const winnerId = key.split('__')[0]
    const winner = members.find(m => m.id === winnerId)
    awards.push({ emoji: '💥', title: 'Biggest Single Day', winner: winner?.name ?? winnerId, detail: `${total} in one day` })
  }

  // 🕵️ Suspiciously Precise Notes
  const noteCount = {}
  for (const e of entries) if (e.note) noteCount[e.member] = (noteCount[e.member] || 0) + 1
  const topNotes = Object.entries(noteCount).sort((a, b) => b[1] - a[1])[0]
  if (topNotes && topNotes[1] >= 2) {
    const winner = members.find(m => m.id === topNotes[0])
    awards.push({ emoji: '🕵️', title: 'Suspiciously Precise Notes', winner: winner?.name ?? topNotes[0], detail: `${topNotes[1]} notes logged` })
  }

  // 🐢 The Reluctant One — least consumed
  const totals = {}
  for (const m of members) totals[m.id] = 0
  for (const e of entries) if (totals[e.member] !== undefined) totals[e.member] += (e.qty || 1)
  const active = Object.entries(totals).filter(([, t]) => t > 0)
  if (active.length >= 2) {
    const min = active.sort((a, b) => a[1] - b[1])[0]
    const winner = members.find(m => m.id === min[0])
    awards.push({ emoji: '🐢', title: 'The Reluctant One', winner: winner?.name ?? min[0], detail: `Only ${min[1]} logged` })
  }

  // 🌍 The Explorer — most distinct locations
  const locCount = {}
  for (const e of entries) {
    if (e.location?.label) locCount[e.member] = (locCount[e.member] || new Set())
    if (e.location?.label) locCount[e.member].add(e.location.label)
  }
  const explorer = Object.entries(locCount).sort((a, b) => b[1].size - a[1].size)[0]
  if (explorer && explorer[1].size >= 2) {
    const winner = members.find(m => m.id === explorer[0])
    awards.push({ emoji: '🌍', title: 'The Explorer', winner: winner?.name ?? explorer[0], detail: `${explorer[1].size} distinct locations` })
  }

  return awards
}
