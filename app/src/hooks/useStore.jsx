import React, { createContext, useContext, useReducer, useCallback } from 'react'
import { loadStore, saveStore, mergeEntries, mergeMembers, mergeCounters } from '../lib/storage.js'
import { generateEntryId } from '../lib/ids.js'

const StoreContext = createContext(null)
const DispatchContext = createContext(null)

function reducer(state, action) {
  let next

  switch (action.type) {
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
      next = { ...state, entries: [...state.entries, entry], undoEntry: { entry, expiresAt: Date.now() + 10000 } }
      break
    }
    case 'UNDO_ENTRY': {
      next = {
        ...state,
        entries: state.entries.filter(e => e.id !== state.undoEntry?.entry?.id),
        undoEntry: null,
      }
      break
    }
    case 'CLEAR_UNDO':
      next = { ...state, undoEntry: null }
      break

    case 'UPSERT_MEMBER': {
      const exists = state.members.find(m => m.id === action.member.id)
      const members = exists
        ? state.members.map(m => m.id === action.member.id ? { ...m, ...action.member } : m)
        : [...state.members, action.member]
      next = { ...state, members }
      break
    }
    case 'SET_MEMBERS':
      next = { ...state, members: action.members }
      break

    case 'UPSERT_COUNTER': {
      const exists = state.counters.find(c => c.id === action.counter.id)
      const counters = exists
        ? state.counters.map(c => c.id === action.counter.id ? { ...c, ...action.counter } : c)
        : [...state.counters, action.counter]
      next = { ...state, counters }
      break
    }
    case 'ARCHIVE_COUNTER':
      next = { ...state, counters: state.counters.map(c => c.id === action.id ? { ...c, archived: true } : c) }
      break
    case 'SET_COUNTERS':
      next = { ...state, counters: action.counters }
      break

    case 'MERGE_REMOTE':
      next = {
        ...state,
        session: action.data.session ?? state.session,
        members: mergeMembers(state.members, action.data.members ?? []),
        counters: mergeCounters(state.counters, action.data.counters ?? []),
        entries: mergeEntries(state.entries, action.data.entries ?? []),
        milestonesFired: Array.from(new Set([...(state.milestonesFired ?? []), ...(action.data.milestonesFired ?? [])])),
      }
      break

    case 'SET_SESSION':
      next = { ...state, session: action.session }
      break

    case 'SET_SYNC_STATUS':
      return { ...state, syncStatus: action.status, lastSyncAt: action.ts ?? state.lastSyncAt }

    case 'ENQUEUE_RETRY':
      return { ...state, pendingPushIds: [...new Set([...(state.pendingPushIds ?? []), action.entryId])] }

    case 'DEQUEUE_RETRY':
      return { ...state, pendingPushIds: (state.pendingPushIds ?? []).filter(id => id !== action.entryId) }

    case 'PUSH_MILESTONE':
      return { ...state, milestoneQueue: [...(state.milestoneQueue ?? []), action.milestone] }

    case 'POP_MILESTONE':
      return { ...state, milestoneQueue: (state.milestoneQueue ?? []).slice(1) }

    case 'SET_ACTIVE_SCREEN':
      return { ...state, activeScreen: action.screen }

    case 'SET_PROFILE_MODAL':
      return { ...state, profileModalOpen: action.open }

    case 'SET_TAUNT':
      return { ...state, taunt: action.taunt }

    case 'CLEAR_TAUNT':
      return { ...state, taunt: null }

    case 'RESET_LOCAL':
      next = { ...loadStore() }
      localStorage.clear()
      break

    case 'ADD_SYNC_LOG': {
      const log = [{ ts: new Date().toISOString(), ...action.entry }, ...(state.syncLog ?? [])].slice(0, 10)
      return { ...state, syncLog: log }
    }

    default:
      return state
  }

  // Persist only data fields, not transient UI state
  saveStore(next)
  return next
}

function buildInitialState() {
  const persisted = loadStore()
  return {
    ...persisted,
    // transient
    syncStatus: 'pending',
    lastSyncAt: null,
    pendingPushIds: [],
    undoEntry: null,
    milestoneQueue: [],
    activeScreen: new URLSearchParams(window.location.search).get('screen') || 'home',
    profileModalOpen: false,
    taunt: null,
    syncLog: [],
  }
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, buildInitialState)

  return (
    <DispatchContext.Provider value={dispatch}>
      <StoreContext.Provider value={state}>
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

// Convenience: navigate to a screen by pushing URL params
export function useNavigate() {
  const dispatch = useDispatch()
  return useCallback((screen, extra = {}) => {
    const params = new URLSearchParams(window.location.search)
    params.set('screen', screen)
    Object.entries(extra).forEach(([k, v]) => v != null ? params.set(k, v) : params.delete(k))
    window.history.pushState({}, '', '?' + params.toString())
    dispatch({ type: 'SET_ACTIVE_SCREEN', screen })
  }, [dispatch])
}
