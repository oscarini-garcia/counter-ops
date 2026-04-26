import { useEffect, useRef } from 'react'
import { useStore, useDispatch } from './useStore.jsx'
import { syncCycle } from '../lib/sync.js'

export function useSync() {
  const state = useStore()
  const dispatch = useDispatch()
  const syncing = useRef(false)

  async function doSync() {
    if (syncing.current) return
    if (!navigator.onLine) return
    syncing.current = true
    dispatch({ type: 'SET_SYNC_STATUS', status: 'syncing' })
    const binId = import.meta.env.VITE_JSONBIN_ID
    const key = import.meta.env.VITE_JSONBIN_KEY
    dispatch({ type: 'ADD_SYNC_LOG', entry: {
      status: 'started',
      binId: binId || '(not set)',
      keyPreview: key ? `${key.slice(0, 10)}…${key.slice(-4)} (${key.length} chars)` : '(not set)',
    }})
    try {
      const merged = await syncCycle(state)
      dispatch({ type: 'MERGE_REMOTE', data: merged })
      dispatch({ type: 'SET_SYNC_STATUS', status: 'synced', ts: new Date().toISOString() })
      dispatch({ type: 'ADD_SYNC_LOG', entry: { status: 'ok' } })
    } catch (err) {
      dispatch({ type: 'SET_SYNC_STATUS', status: 'pending' })
      dispatch({ type: 'ADD_SYNC_LOG', entry: {
        status: 'error',
        message: err.message,
        httpStatus: err.status ?? null,
        responseBody: err.responseBody ?? null,
        payloadBytes: err.payloadBytes ?? null,
      }})
    } finally {
      syncing.current = false
    }
  }

  useEffect(() => { doSync() }, [])

  useEffect(() => {
    const handler = () => doSync()
    window.addEventListener('counter-ops:sync', handler)
    return () => window.removeEventListener('counter-ops:sync', handler)
  }, [state])

  useEffect(() => {
    window.addEventListener('online', doSync)
    return () => window.removeEventListener('online', doSync)
  }, [state])
}
