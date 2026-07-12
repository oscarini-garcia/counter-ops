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
  currentMemberId: null,   // device-level identity, never synced
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
    currentMemberId: state.currentMemberId ?? null,
  }))
}

// ── Per-session merge helpers ──

// Tombstones are either plain ids (legacy) or { id, ts } (timestamped).
// An item edited/re-created AFTER its deletion (item.updatedAt > tombstone ts)
// survives; legacy string tombstones have ts '' so any updatedAt lifts them.
export function tombstoneMap(deletedIds = []) {
  const map = new Map()
  for (const t of deletedIds) {
    const id = typeof t === 'string' ? t : t?.id
    if (!id) continue
    const ts = typeof t === 'string' ? '' : (t.ts ?? '')
    if (!map.has(id) || ts > map.get(id)) map.set(id, ts)
  }
  return map
}

function isDeleted(tombs, item) {
  if (!tombs.has(item.id)) return false
  return !((item.updatedAt ?? '') > tombs.get(item.id))
}

export function unionTombstones(a = [], b = []) {
  const map = tombstoneMap([...a, ...b])
  return Array.from(map.entries()).map(([id, ts]) => (ts ? { id, ts } : id))
}

export function mergeEntries(local = [], remote = [], deletedIds = []) {
  const tombs = tombstoneMap(deletedIds)
  const map = new Map()
  for (const e of local) if (!isDeleted(tombs, e)) map.set(e.id, e)
  for (const e of remote) {
    if (isDeleted(tombs, e)) continue
    const cur = map.get(e.id)
    if (!cur) map.set(e.id, e)
    // Admin edits carry updatedAt — the most recent edit wins across devices
    else if ((e.updatedAt ?? '') > (cur.updatedAt ?? '')) map.set(e.id, e)
  }
  return Array.from(map.values()).sort((a, b) => a.timestamp.localeCompare(b.timestamp))
}

export function mergeMembers(local = [], remote = [], deletedIds = []) {
  const tombs = tombstoneMap(deletedIds)
  const map = new Map(local.map(m => [m.id, m]))
  for (const m of remote) {
    if (isDeleted(tombs, m)) continue
    const cur = map.get(m.id)
    if (!cur) map.set(m.id, m)
    // Edits carry updatedAt — the most recent edit wins across devices
    else if ((m.updatedAt ?? '') > (cur.updatedAt ?? '')) map.set(m.id, m)
    else if (!cur.avatar && m.avatar) map.set(m.id, { ...cur, avatar: m.avatar })
  }
  return Array.from(map.values()).filter(m => !isDeleted(tombs, m))
}

export function mergeCounters(local = [], remote = [], deletedIds = []) {
  const tombs = tombstoneMap(deletedIds)
  const map = new Map(local.map(c => [c.id, c]))
  for (const c of remote) {
    if (isDeleted(tombs, c)) continue
    const cur = map.get(c.id)
    if (!cur) map.set(c.id, c)
    // Edits carry updatedAt — the most recent edit wins across devices
    else if ((c.updatedAt ?? '') > (cur.updatedAt ?? '')) map.set(c.id, c)
  }
  return Array.from(map.values()).filter(c => !isDeleted(tombs, c))
}

export function mergeSessions(local = [], remote = []) {
  const map = new Map(local.map(s => [s.id, s]))
  for (const rs of remote) {
    if (map.has(rs.id)) {
      const ls = map.get(rs.id)
      // Union tombstone lists so deletes propagate across devices
      const deletedMemberIds = unionTombstones(ls.deletedMemberIds, rs.deletedMemberIds)
      const deletedCounterIds = unionTombstones(ls.deletedCounterIds, rs.deletedCounterIds)
      const deletedEntryIds = unionTombstones(ls.deletedEntryIds, rs.deletedEntryIds)
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
