import React, { useState } from 'react'
import { useStore } from '../hooks/useStore.jsx'
import EntryRow from '../components/EntryRow.jsx'

export default function EntryLogScreen() {
  const { entries, members, counters } = useStore()
  const [filterMember, setFilterMember] = useState('')
  const [filterCounter, setFilterCounter] = useState('')

  const filtered = [...entries]
    .filter(e => !filterMember || e.member === filterMember)
    .filter(e => !filterCounter || e.counter === filterCounter)
    .reverse()

  return (
    <div className="flex flex-col h-full">
      {/* Filter bar */}
      <div className="flex gap-2 px-4 py-3 border-b border-slate-700 overflow-x-auto">
        <select
          value={filterMember}
          onChange={e => setFilterMember(e.target.value)}
          className="bg-slate-700 text-slate-200 text-sm rounded-lg px-2 py-1.5 outline-none"
        >
          <option value="">All members</option>
          {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <select
          value={filterCounter}
          onChange={e => setFilterCounter(e.target.value)}
          className="bg-slate-700 text-slate-200 text-sm rounded-lg px-2 py-1.5 outline-none"
        >
          <option value="">All counters</option>
          {counters.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
        </select>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
            <div className="text-4xl">📋</div>
            <p className="text-sm">No entries yet.</p>
          </div>
        ) : (
          filtered.map(e => <EntryRow key={e.id} entry={e} />)
        )}
      </div>
    </div>
  )
}
