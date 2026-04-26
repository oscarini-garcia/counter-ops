import { useMemo } from 'react'
import { useStore } from './useStore.jsx'

export function useMember() {
  const { members } = useStore()
  const memberId = useMemo(() => {
    return new URLSearchParams(window.location.search).get('member') || ''
  }, [])

  const member = members.find(m => m.id === memberId) ?? null
  return { memberId, member }
}
