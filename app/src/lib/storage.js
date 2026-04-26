const KEY = 'counter-ops-store'

export const EMPTY_SESSION = {
  id: 'default',
  name: 'My Trip',
  createdAt: new Date().toISOString(),
  members: [],
  counters: [],
  entries: [],
  milestonesFired: [],
  deletedMemberIds: [],
  deletedCounterIds: [],
  deletedEntryIds: [],
}

export const EMPTY_STORE = {
  sessions: [],
  activeSessionId: null,
}

export function loadStore() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...EMPTY_STORE }
    const persisted = JSON.parse(raw)

    // ── Migrate old flat format → sessions ──
    if (!persisted.sessions && (persisted.members || persisted.counters || persisted.entries)) {
      const session = {
        ...EMPTY_SESSION,
        id: slugify(persisted.session || 'my-trip'),
        name: persisted.session || 'My Trip',
        members: persisted.members ?? [],
        counters: persisted.counters ?? [],
        entries: persisted.entries ?? [],
        milestonesFired: persisted.milestonesFired ?? [],
      }
      return {
        sessions: [session],
        activeSessionId: session.id,
      }
    }

    return { ...EMPTY_STORE, ...persisted }
  } catch {
    return { ...EMPTY_STORE }
  }
}

export function saveStore(state) {
  localStorage.setItem(KEY, JSON.stringify({
    sessions: state.sessions,
    activeSessionId: state.activeSessionId,
  }))
}

// ── Per-session merge helpers ──

export function mergeEntries(local = [], remote = [], deletedIds = []) {
  const deleted = new Set(deletedIds)
  const map = new Map()
  for (const e of local) if (!deleted.has(e.id)) map.set(e.id, e)
  for (const e of remote) { if (!deleted.has(e.id) && !map.has(e.id)) map.set(e.id, e) }
  return Array.from(map.values()).sort((a, b) => a.timestamp.localeCompare(b.timestamp))
}

export function mergeMembers(local = [], remote = [], deletedIds = []) {
  const deleted = new Set(deletedIds)
  const map = new Map(local.map(m => [m.id, m]))
  for (const m of remote) {
    if (deleted.has(m.id)) continue                          // tombstone wins
    if (!map.has(m.id)) map.set(m.id, m)
    else if (!map.get(m.id).avatar && m.avatar) map.set(m.id, { ...map.get(m.id), avatar: m.avatar })
  }
  return Array.from(map.values()).filter(m => !deleted.has(m.id))
}

export function mergeCounters(local = [], remote = [], deletedIds = []) {
  const deleted = new Set(deletedIds)
  const map = new Map(local.map(c => [c.id, c]))
  for (const c of remote) {
    if (deleted.has(c.id)) continue                          // tombstone wins
    if (!map.has(c.id)) map.set(c.id, c)
  }
  return Array.from(map.values()).filter(c => !deleted.has(c.id))
}

export function mergeSessions(local = [], remote = []) {
  const map = new Map(local.map(s => [s.id, s]))
  for (const rs of remote) {
    if (map.has(rs.id)) {
      const ls = map.get(rs.id)
      // Union tombstone lists so deletes propagate across devices
      const deletedMemberIds = Array.from(new Set([...(ls.deletedMemberIds ?? []), ...(rs.deletedMemberIds ?? [])]))
      const deletedCounterIds = Array.from(new Set([...(ls.deletedCounterIds ?? []), ...(rs.deletedCounterIds ?? [])]))
      const deletedEntryIds = Array.from(new Set([...(ls.deletedEntryIds ?? []), ...(rs.deletedEntryIds ?? [])]))
      map.set(rs.id, {
        ...rs,
        name: ls.name,        // local name wins
        members: mergeMembers(ls.members, rs.members, deletedMemberIds),
        counters: mergeCounters(ls.counters, rs.counters, deletedCounterIds),
        entries: mergeEntries(ls.entries, rs.entries, deletedEntryIds),
        milestonesFired: Array.from(new Set([...(ls.milestonesFired ?? []), ...(rs.milestonesFired ?? [])])),
        deletedMemberIds,
        deletedCounterIds,
        deletedEntryIds,
      })
    } else {
      map.set(rs.id, rs)
    }
  }
  return Array.from(map.values()).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || Date.now().toString()
}
