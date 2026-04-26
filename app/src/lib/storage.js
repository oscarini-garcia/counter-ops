const KEY = 'counter-ops-store'
const RETRY_KEY = 'counter-ops-retry-queue'

export const EMPTY_STORE = {
  session: 'my-trip',
  members: [],
  counters: [],
  entries: [],
  milestonesFired: [],
}

export function loadStore() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...EMPTY_STORE }
    return { ...EMPTY_STORE, ...JSON.parse(raw) }
  } catch {
    return { ...EMPTY_STORE }
  }
}

export function saveStore(state) {
  const { session, members, counters, entries, milestonesFired } = state
  localStorage.setItem(KEY, JSON.stringify({ session, members, counters, entries, milestonesFired }))
}

export function loadRetryQueue() {
  try {
    return JSON.parse(localStorage.getItem(RETRY_KEY) || '[]')
  } catch {
    return []
  }
}

export function saveRetryQueue(queue) {
  localStorage.setItem(RETRY_KEY, JSON.stringify(queue))
}

// Additive merge — union by id, no overwrites. Returns merged entries array.
export function mergeEntries(local, remote) {
  const map = new Map()
  for (const e of local) map.set(e.id, e)
  for (const e of remote) {
    if (!map.has(e.id)) map.set(e.id, e)
  }
  return Array.from(map.values()).sort((a, b) => a.timestamp.localeCompare(b.timestamp))
}

export function mergeMembers(local, remote) {
  const map = new Map(local.map(m => [m.id, m]))
  for (const m of remote) {
    if (!map.has(m.id)) map.set(m.id, m)
    // Remote avatar updates a local member that has no avatar yet
    else if (!map.get(m.id).avatar && m.avatar) {
      map.set(m.id, { ...map.get(m.id), avatar: m.avatar })
    }
  }
  return Array.from(map.values())
}

export function mergeCounters(local, remote) {
  const map = new Map(local.map(c => [c.id, c]))
  for (const c of remote) {
    if (!map.has(c.id)) map.set(c.id, c)
  }
  return Array.from(map.values())
}
