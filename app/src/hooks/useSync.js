import { useEffect, useRef } from 'react'
import { useStore, useDispatch } from './useStore.jsx'
import { syncCycle } from '../lib/sync.js'
import { saveRetryQueue, loadRetryQueue } from '../lib/storage.js'

export function useSync() {
  const state = useStore()
  const dispatch = useDispatch()
  const syncing = useRef(false)

  async function doSync() {
    if (syncing.current) return
    if (!navigator.onLine) return
    syncing.current = true
    dispatch({ type: 'SET_SYNC_STATUS', status: 'syncing' })
    dispatch({ type: 'ADD_SYNC_LOG', entry: { status: 'started' } })
    try {
      const merged = await syncCycle(state)
      dispatch({ type: 'MERGE_REMOTE', data: merged })
      dispatch({ type: 'SET_SYNC_STATUS', status: 'synced', ts: new Date().toISOString() })
      dispatch({ type: 'ADD_SYNC_LOG', entry: { status: 'ok' } })
      saveRetryQueue([])
    } catch (err) {
      dispatch({ type: 'SET_SYNC_STATUS', status: 'pending' })
      dispatch({ type: 'ADD_SYNC_LOG', entry: { status: 'error', message: err.message } })
    } finally {
      syncing.current = false
    }
  }

  // Pull on mount
  useEffect(() => {
    doSync()
  }, [])

  // Listen for manual sync trigger
  useEffect(() => {
    const handler = () => doSync()
    window.addEventListener('counter-ops:sync', handler)
    return () => window.removeEventListener('counter-ops:sync', handler)
  }, [state])

  // Sync when coming back online
  useEffect(() => {
    window.addEventListener('online', doSync)
    return () => window.removeEventListener('online', doSync)
  }, [state])
}
