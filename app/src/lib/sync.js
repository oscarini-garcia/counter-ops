import { mergeEntries, mergeMembers, mergeCounters } from './storage.js'

const BIN_ID = import.meta.env.VITE_JSONBIN_ID
const API_KEY = import.meta.env.VITE_JSONBIN_KEY
const BASE = `https://api.jsonbin.io/v3/b/${BIN_ID}`

async function request(method, body) {
  const headers = {
    'Content-Type': 'application/json',
    'X-Master-Key': API_KEY,
    'X-Bin-Versioning': 'false',
  }
  const res = await fetch(BASE, { method, headers, body: body ? JSON.stringify(body) : undefined })
  if (!res.ok) throw new Error(`JSONBin ${method} ${res.status}`)
  return res.json()
}

export async function pullRemote() {
  const data = await request('GET')
  return data.record ?? data
}

export async function pushRemote(localState) {
  const payload = {
    session: localState.session,
    members: localState.members,
    counters: localState.counters,
    entries: localState.entries,
    milestonesFired: localState.milestonesFired ?? [],
  }
  await request('PUT', payload)
}

// Full push-pull-merge cycle. Returns merged state fields to dispatch.
export async function syncCycle(localState) {
  if (!BIN_ID || !API_KEY) throw new Error('JSONBin not configured')

  // Pull first
  const remote = await pullRemote()

  // Merge
  const mergedEntries = mergeEntries(localState.entries, remote.entries ?? [])
  const mergedMembers = mergeMembers(localState.members, remote.members ?? [])
  const mergedCounters = mergeCounters(localState.counters, remote.counters ?? [])
  const mergedMilestonesFired = Array.from(new Set([...(localState.milestonesFired ?? []), ...(remote.milestonesFired ?? [])]))

  const merged = {
    session: remote.session ?? localState.session,
    members: mergedMembers,
    counters: mergedCounters,
    entries: mergedEntries,
    milestonesFired: mergedMilestonesFired,
  }

  // Push merged state back
  await pushRemote(merged)

  return merged
}
