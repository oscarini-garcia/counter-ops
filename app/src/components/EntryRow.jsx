import React from 'react'
import { useStore } from '../hooks/useStore.jsx'

export default function EntryRow({ entry }) {
  const { members, counters } = useStore()
  const member = members.find(m => m.id === entry.member)
  const counter = counters.find(c => c.id === entry.counter)

  const time = new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const date = new Date(entry.timestamp).toLocaleDateString([], { day: 'numeric', month: 'short' })

  return (
    <div className="flex items-start gap-3 px-4 py-3 border-b border-slate-700">
      <div className="text-2xl leading-none pt-0.5">{counter?.emoji ?? '?'}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span className="font-medium text-slate-100">{member?.name ?? entry.member}</span>
          <span className="text-slate-400 text-sm">× {entry.qty}</span>
          <span className="text-slate-300 text-sm">{counter?.label ?? entry.counter}</span>
        </div>
        {entry.rating && (
          <div className="text-xs mt-0.5">{'⭐'.repeat(entry.rating)}</div>
        )}
        {entry.location?.label && (
          <div className="text-xs text-slate-400 mt-0.5 truncate">📍 {entry.location.label}</div>
        )}
        {entry.note && <div className="text-xs text-slate-400 mt-0.5 italic">"{entry.note}"</div>}
      </div>
      <div className="text-right text-xs text-slate-500 flex-shrink-0">
        <div>{time}</div>
        <div>{date}</div>
      </div>
    </div>
  )
}
