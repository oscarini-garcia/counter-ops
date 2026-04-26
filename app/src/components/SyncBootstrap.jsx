import { useSync } from '../hooks/useSync.js'

// Side-effect only component — mounts the sync lifecycle into the tree
export default function SyncBootstrap() {
  useSync()
  return null
}
