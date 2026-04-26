import { mergeSessions } from './storage.js'

const BIN_ID = import.meta.env.VITE_JSONBIN_ID
const API_KEY = import.meta.env.VITE_JSONBIN_KEY
const BASE = `https://api.jsonbin.io/v3/b/${BIN_ID}`

async function request(method, body) {
  const headers = {
    'Content-Type': 'application/json',
    'X-Master-Key': API_KEY,
    'X-Bin-Versioning': 'false',
  }

  const bodyStr = body ? JSON.stringify(body) : undefined

  console.debug(`[sync] ${method} ${BASE}`, {
    binId: BIN_ID,
    hasKey: !!API_KEY,
    payloadBytes: bodyStr?.length ?? 0,
  })

  const res = await fetch(BASE, { method, headers, body: bodyStr })

  if (!res.ok) {
    let responseText = ''
    try { responseText = await res.text() } catch { /* ignore */ }
    const err = new Error(`JSONBin ${method} ${res.status}`)
    err.status = res.status
    err.responseBody = responseText
    err.payloadBytes = bodyStr?.length ?? 0
    console.error(`[sync] ${method} failed`, {
      status: res.status,
      responseBody: responseText,
      payloadBytes: bodyStr?.length ?? 0,
      binId: BIN_ID,
      hasKey: !!API_KEY,
    })
    throw err
  }

  const json = await res.json()
  console.debug(`[sync] ${method} ok`, { status: res.status })
  return json
}

export async function pullRemote() {
  const data = await request('GET')
  return data.record ?? data
}

export async function pushRemote(state) {
  await request('PUT', {
    sessions: state.sessions,
    activeSessionId: state.activeSessionId,
  })
}

export async function syncCycle(localState) {
  if (!BIN_ID) throw new Error('VITE_JSONBIN_ID is not set')
  if (!API_KEY) throw new Error('VITE_JSONBIN_KEY is not set')

  console.debug('[sync] starting sync cycle', {
    sessions: localState.sessions?.length,
    activeSessionId: localState.activeSessionId,
  })

  const remote = await pullRemote()

  console.debug('[sync] pulled remote', {
    remoteSessions: remote.sessions?.length ?? 0,
  })

  const mergedSessions = mergeSessions(
    localState.sessions,
    remote.sessions ?? []
  )

  const merged = {
    sessions: mergedSessions,
    activeSessionId: localState.activeSessionId ?? remote.activeSessionId ?? null,
  }

  console.debug('[sync] pushing merged state', {
    sessions: mergedSessions.length,
    totalEntries: mergedSessions.reduce((n, s) => n + (s.entries?.length ?? 0), 0),
  })

  await pushRemote(merged)

  console.debug('[sync] sync cycle complete')
  return merged
}
