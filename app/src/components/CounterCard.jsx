import React from 'react'
import { useStore, useDispatch } from '../hooks/useStore.jsx'
import { useMember } from '../hooks/useMember.js'
import { useVibration } from '../hooks/useVibration.js'

export default function CounterCard({ counter, onQuickAdd }) {
  const { entries } = useStore()
  const { memberId } = useMember()
  const vibrate = useVibration()

  const total = entries
    .filter(e => e.counter === counter.id && !e._deleted)
    .reduce((s, e) => s + (e.qty || 1), 0)

  const myTotal = entries
    .filter(e => e.counter === counter.id && e.member === memberId && !e._deleted)
    .reduce((s, e) => s + (e.qty || 1), 0)

  function handleQuickAdd() {
    vibrate(30)
    onQuickAdd(counter.id)
  }

  return (
    <button
      onClick={handleQuickAdd}
      className="flex flex-col items-center text-center active:scale-95 transition-transform"
      style={{
        background: 'var(--c-surface)',
        border: '1.5px solid var(--c-border)',
        borderRadius: 20,
        padding: '20px 12px 16px',
        gap: 6,
        display: 'flex',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        cursor: 'pointer',
        width: '100%',
      }}
    >
      <span style={{ fontSize: 40, lineHeight: 1 }}>{counter.emoji}</span>
      <span
        className="font-bold text-sm leading-tight"
        style={{ color: 'var(--c-text)' }}
      >
        {counter.label}
      </span>
      <span
        className="font-black leading-none"
        style={{ fontSize: 34, color: 'var(--c-brand)' }}
      >
        {total}
      </span>
      {myTotal > 0 && (
        <span className="text-xs" style={{ color: 'var(--c-text-muted)' }}>
          Mine: {myTotal}
        </span>
      )}
    </button>
  )
}
