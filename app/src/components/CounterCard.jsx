import React from 'react'
import { useStore, useDispatch } from '../hooks/useStore.jsx'
import { useMember } from '../hooks/useMember.js'
import { useVibration } from '../hooks/useVibration.js'

export default function CounterCard({ counter, onQuickAdd }) {
  const { entries } = useStore()
  const { memberId } = useMember()
  const vibrate = useVibration()

  const total = entries.filter(e => e.counter === counter.id && !e._deleted)
    .reduce((s, e) => s + (e.qty || 1), 0)

  const myTotal = entries.filter(e => e.counter === counter.id && e.member === memberId && !e._deleted)
    .reduce((s, e) => s + (e.qty || 1), 0)

  function handleQuickAdd() {
    vibrate(30)
    onQuickAdd(counter.id)
  }

  return (
    <button
      onClick={handleQuickAdd}
      className="flex items-center justify-between w-full px-4 py-3 bg-slate-800 rounded-xl active:bg-slate-700 transition-colors text-left"
    >
      <div className="flex items-center gap-3">
        <span className="text-3xl leading-none">{counter.emoji}</span>
        <div>
          <div className="font-semibold text-slate-100">{counter.label}</div>
          <div className="text-xs text-slate-400">
            {myTotal > 0 ? `You: ${myTotal} · ` : ''}Total: {total}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold text-indigo-400">{total}</span>
        <span className="text-slate-400 text-xl leading-none">›</span>
      </div>
    </button>
  )
}
