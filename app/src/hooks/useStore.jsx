import React, { createContext, useContext, useReducer, useCallback } from 'react'
import { loadStore, saveStore, mergeSessions, EMPTY_SESSION } from '../lib/storage.js'
import { generateEntryId } from '../lib/ids.js'

const StoreContext = createContext(null)
const DispatchContext = createContext(null)

// Helper: update the active session immutably
function updateActive(state, updater) {
  const sessions = state.sessions.map(s =>
    s.id === state.activeSessionId ? { ...s, ...updater(s) } : s
  )
  return { ...state, sessions }
}

function reducer(state, action) {
  let next

  switch (action.type) {

    // ── Sessions ──
    case 'CREATE_SESSION': {
      const id = slugify(action.name) + '_' + Date.now()
      const session = { ...EMPTY_SESSION, id, name: action.name, createdAt: new Date().toISOString() }
      next = { ...state, sessions: [...state.sessions, session], activeSessionId: id }
      break
    }
    case 'SET_ACTIVE_SESSION':
      return { ...state, activeSessionId: action.id, sessionSwitcherOpen: false }

    case 'RENAME_SESSION':
      next = updateActive(state, () => ({ name: action.name }))
      break

    case 'REMOVE_SESSION': {
      const sessions = state.sessions.filter(s => s.id !== action.id)
      const activeSessionId = state.activeSessionId === action.id
        ? (sessions[0]?.id ?? null)
        : state.activeSessionId
      next = { ...state, sessions, activeSessionId }
      break
    }

    // ── Entries ──
    case 'ADD_ENTRY': {
      const entry = {
        id: generateEntryId(action.memberId),
        member: action.memberId,
        counter: action.counterId,
        qty: action.qty ?? 1,
        location: action.location ?? null,
        timestamp: new Date().toISOString(),
        note: action.note ?? '',
      }
      next = updateActive(state, s => ({
        entries: [...s.entries, entry],
      }))
      next = { ...next, undoEntry: { entry, expiresAt: Date.now() + 10000 } }
      break
    }
    case 'UNDO_ENTRY':
      next = updateActive(state, s => ({
        entries: s.entries.filter(e => e.id !== state.undoEntry?.entry?.id),
      }))
      next = { ...next, undoEntry: null }
      break

    case 'CLEAR_UNDO':
      return { ...state, undoEntry: null }

    // ── Members ──
    case 'UPSERT_MEMBER':
      next = updateActive(state, s => {
        const exists = s.members.find(m => m.id === action.member.id)
        return {
          members: exists
            ? s.members.map(m => m.id === action.member.id ? { ...m, ...action.member } : m)
            : [...s.members, action.member]
        }
      })
      break

    case 'REMOVE_MEMBER':
      next = updateActive(state, s => ({ members: s.members.filter(m => m.id !== action.id) }))
      break

    // Rename member ID + migrate all entries pointing to oldId
    case 'FIX_MEMBER_ID':
      next = updateActive(state, s => ({
        members: s.members.map(m => m.id === action.oldId ? { ...m, id: action.newId } : m),
        entries: s.entries.map(e => e.member === action.oldId ? { ...e, member: action.newId } : e),
      }))
      break

    case 'REORDER_MEMBERS':
      next = updateActive(state, s => {
        const members = [...s.members]
        const [item] = members.splice(action.from, 1)
        members.splice(action.to, 0, item)
        return { members }
      })
      break

    // ── Counters ──
    case 'UPSERT_COUNTER':
      next = updateActive(state, s => {
        const exists = s.counters.find(c => c.id === action.counter.id)
        return {
          counters: exists
            ? s.counters.map(c => c.id === action.counter.id ? { ...c, ...action.counter } : c)
            : [...s.counters, action.counter]
        }
      })
      break

    case 'REMOVE_COUNTER':
      next = updateActive(state, s => ({ counters: s.counters.filter(c => c.id !== action.id) }))
      break

    case 'REORDER_COUNTERS':
      next = updateActive(state, s => {
        const counters = [...s.counters]
        const [item] = counters.splice(action.from, 1)
        counters.splice(action.to, 0, item)
        return { counters }
      })
      break

    // ── Remote sync ──
    case 'MERGE_REMOTE':
      next = {
        ...state,
        sessions: mergeSessions(state.sessions, action.data.sessions ?? []),
        activeSessionId: state.activeSessionId ?? action.data.activeSessionId ?? null,
      }
      break

    // ── Milestone / gamification ──
    case 'PUSH_MILESTONE':
      return { ...state, milestoneQueue: [...(state.milestoneQueue ?? []), action.milestone] }
    case 'POP_MILESTONE':
      return { ...state, milestoneQueue: (state.milestoneQueue ?? []).slice(1) }
    case 'MARK_MILESTONE_FIRED':
      next = updateActive(state, s => ({
        milestonesFired: [...(s.milestonesFired ?? []), action.key]
      }))
      break

    // ── Sync status ──
    case 'SET_SYNC_STATUS':
      return { ...state, syncStatus: action.status, lastSyncAt: action.ts ?? state.lastSyncAt }
    case 'ADD_SYNC_LOG': {
      const log = [{ ts: new Date().toISOString(), ...action.entry }, ...(state.syncLog ?? [])].slice(0, 10)
      return { ...state, syncLog: log }
    }

    // ── UI ──
    case 'SET_ACTIVE_SCREEN':
      return { ...state, activeScreen: action.screen }
    case 'SET_PROFILE_MODAL':
      return { ...state, profileModalOpen: action.open }
    case 'SET_ADMIN_UNLOCKED':
      return { ...state, adminUnlocked: action.value }
    case 'SET_SESSION_SWITCHER':
      return { ...state, sessionSwitcherOpen: action.open }
    case 'SET_TAUNT':
      return { ...state, taunt: action.taunt }
    case 'CLEAR_TAUNT':
      return { ...state, taunt: null }

    case 'RESET_LOCAL':
      localStorage.clear()
      return buildInitialState()

    default:
      return state
  }

  saveStore(next)
  return next
}

function buildInitialState() {
  const persisted = loadStore()
  return {
    ...persisted,
    // transient UI state — never persisted
    syncStatus: 'pending',
    lastSyncAt: null,
    undoEntry: null,
    milestoneQueue: [],
    activeScreen: 'home',
    profileModalOpen: false,
    adminUnlocked: false,
    sessionSwitcherOpen: false,
    taunt: null,
    syncLog: [],
  }
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || Date.now().toString()
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, buildInitialState)

  // Compute activeSession and surface members/counters/entries as top-level
  // so all existing screens continue to work without changes
  const activeSession = state.sessions.find(s => s.id === state.activeSessionId) ?? state.sessions[0] ?? null

  const enriched = {
    ...state,
    activeSession,
    members: activeSession?.members ?? [],
    counters: activeSession?.counters ?? [],
    entries: activeSession?.entries ?? [],
    milestonesFired: activeSession?.milestonesFired ?? [],
  }

  return (
    <DispatchContext.Provider value={dispatch}>
      <StoreContext.Provider value={enriched}>
        {children}
      </StoreContext.Provider>
    </DispatchContext.Provider>
  )
}

export function useStore() {
  return useContext(StoreContext)
}

export function useDispatch() {
  return useContext(DispatchContext)
}

export function useNavigate() {
  const dispatch = useDispatch()
  return useCallback((screen) => {
    window.history.pushState({}, '', window.location.pathname + window.location.search)
    dispatch({ type: 'SET_ACTIVE_SCREEN', screen })
  }, [dispatch])
}
