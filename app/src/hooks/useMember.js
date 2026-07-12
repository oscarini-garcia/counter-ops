import { useEffect } from 'react'
import { useStore, useDispatch } from './useStore.jsx'

// Identity resolution, in priority order:
// 1. ?member= in the URL — only if it matches a real member (unknown ids
//    fall through so nobody logs entries as a ghost user)
// 2. the identity remembered on this device (currentMemberId)
// 3. nothing → the app asks "who are you?"
export function useMember() {
  const { members, currentMemberId } = useStore()
  const dispatch = useDispatch()

  const urlId    = new URLSearchParams(window.location.search).get('member') || ''
  const urlValid = urlId !== '' && members.some(m => m.id === urlId)

  const storedValid = !!currentMemberId && members.some(m => m.id === currentMemberId)

  const memberId = urlValid ? urlId : (storedValid ? currentMemberId : '')

  // A valid personal link claims this device, so the identity survives
  // opening the app later without the link
  useEffect(() => {
    if (urlValid && currentMemberId !== urlId) {
      dispatch({ type: 'SET_CURRENT_MEMBER', id: urlId })
    }
  }, [urlValid, urlId, currentMemberId])

  const member = members.find(m => m.id === memberId) ?? null
  return { memberId, member }
}

// Switch identity from the UI. The URL param outranks the stored identity,
// so it must be rewritten too or the change would silently not stick.
export function switchMember(dispatch, id) {
  const url = new URL(window.location)
  if (url.searchParams.has('member')) {
    url.searchParams.set('member', id)
    window.history.replaceState({}, '', url)
  }
  dispatch({ type: 'SET_CURRENT_MEMBER', id })
}
