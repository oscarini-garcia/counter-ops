import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import { useStore, useDispatch } from '../hooks/useStore.jsx'
import { useMember } from '../hooks/useMember.js'
import { compressAvatar } from '../lib/imageCompress.js'

export default function ProfileModal() {
  const { profileModalOpen, members } = useStore()
  const dispatch = useDispatch()
  const { memberId, member } = useMember()
  const [name, setName] = useState('')
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [compressing, setCompressing] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    // Open on custom event from AppShell
    const handler = () => dispatch({ type: 'SET_PROFILE_MODAL', open: true })
    window.addEventListener('counter-ops:open-profile', handler)
    return () => window.removeEventListener('counter-ops:open-profile', handler)
  }, [])

  useEffect(() => {
    if (profileModalOpen) {
      setName(member?.name ?? memberId)
      setAvatarPreview(member?.avatar ?? null)
    }
  }, [profileModalOpen])

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setCompressing(true)
    try {
      const b64 = await compressAvatar(file)
      setAvatarPreview(b64)
    } catch {
      // silently ignore
    } finally {
      setCompressing(false)
    }
  }

  function handleSave() {
    if (!memberId) return
    dispatch({
      type: 'UPSERT_MEMBER',
      member: { id: memberId, name: name.trim() || memberId, avatar: avatarPreview ?? member?.avatar ?? null }
    })
    dispatch({ type: 'SET_PROFILE_MODAL', open: false })
    window.dispatchEvent(new CustomEvent('counter-ops:sync'))
  }

  function close() {
    dispatch({ type: 'SET_PROFILE_MODAL', open: false })
  }

  if (!profileModalOpen) return null

  const initials = (name || memberId || '?').slice(0, 2).toUpperCase()

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={close}>
      <div
        className="rounded-t-3xl w-full max-w-lg p-6"
        style={{
          background: 'var(--c-surface)',
          paddingBottom: 'calc(1.5rem + var(--safe-bottom))',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold" style={{ color: 'var(--c-text)' }}>Your Profile</h2>
          <button
            onClick={close}
            className="text-xl w-8 h-8 flex items-center justify-center"
            style={{ color: 'var(--c-text-muted)' }}
          >✕</button>
        </div>

        {/* Avatar */}
        <div className="flex flex-col items-center mb-5 gap-3">
          <div
            className="w-20 h-20 rounded-3xl overflow-hidden flex items-center justify-center text-3xl font-bold text-white"
            style={{ background: 'var(--c-brand)' }}
          >
            {avatarPreview
              ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
              : initials
            }
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={compressing}
            className="text-sm active:opacity-70"
            style={{ color: 'var(--c-brand)' }}
          >
            {compressing ? '⏳ Compressing…' : '📷 Change photo'}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Name */}
        <div className="mb-5">
          <label
            className="text-xs font-semibold uppercase tracking-wider block mb-1.5"
            style={{ color: 'var(--c-text-muted)' }}
          >Display name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full rounded-xl px-3 py-3 text-base outline-none"
            style={{
              background: 'var(--c-surface-2)',
              border: '1.5px solid var(--c-border)',
              color: 'var(--c-text)',
            }}
          />
        </div>

        <button
          onClick={handleSave}
          disabled={compressing}
          className="w-full font-semibold py-3.5 rounded-2xl text-base disabled:opacity-40 active:opacity-80"
          style={{ background: 'var(--c-brand)', color: '#fff' }}
        >
          Save
        </button>
      </div>
    </div>,
    document.body
  )
}
