import React, { useState } from 'react'
import { useStore, useDispatch } from '../hooks/useStore.jsx'
import QRCodeCard from '../components/QRCodeCard.jsx'

const EMOJI_SUGGESTIONS = ['🍦','🍹','🧊','🍺','🍕','🌮','☕','🍰','🎾','🏊','🚶','🧴']

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || Date.now().toString()
}

function suggestEmoji(label) {
  const lower = label.toLowerCase()
  if (lower.includes('ice') || lower.includes('cream') || lower.includes('granit')) return '🍦'
  if (lower.includes('pomada') || lower.includes('drink') || lower.includes('cocktail')) return '🍹'
  if (lower.includes('beer') || lower.includes('cerve')) return '🍺'
  if (lower.includes('coffee') || lower.includes('café')) return '☕'
  if (lower.includes('pizza')) return '🍕'
  if (lower.includes('swim') || lower.includes('pool')) return '🏊'
  return EMOJI_SUGGESTIONS[Math.floor(Math.random() * EMOJI_SUGGESTIONS.length)]
}

export default function AdminScreen() {
  const { counters, members, session } = useStore()
  const dispatch = useDispatch()

  const [newCounterLabel, setNewCounterLabel] = useState('')
  const [newCounterEmoji, setNewCounterEmoji] = useState('')
  const [newMemberName, setNewMemberName] = useState('')

  const baseUrl = window.location.origin + window.location.pathname

  function addCounter(e) {
    e.preventDefault()
    if (!newCounterLabel.trim()) return
    const label = newCounterLabel.trim()
    dispatch({
      type: 'UPSERT_COUNTER',
      counter: { id: slugify(label), label, emoji: newCounterEmoji || suggestEmoji(label) }
    })
    setNewCounterLabel('')
    setNewCounterEmoji('')
    window.dispatchEvent(new CustomEvent('counter-ops:sync'))
  }

  function addMember(e) {
    e.preventDefault()
    if (!newMemberName.trim()) return
    const name = newMemberName.trim()
    dispatch({ type: 'UPSERT_MEMBER', member: { id: slugify(name), name } })
    setNewMemberName('')
    window.dispatchEvent(new CustomEvent('counter-ops:sync'))
  }

  return (
    <div className="px-4 py-4 flex flex-col gap-6 max-w-lg mx-auto pb-8">
      <h1 className="text-lg font-bold text-slate-100">⚙️ Admin</h1>

      {/* Session */}
      <div>
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Session name</label>
        <input
          type="text"
          value={session}
          onChange={e => dispatch({ type: 'SET_SESSION', session: e.target.value })}
          className="w-full bg-slate-700 text-slate-100 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Counters */}
      <div>
        <h2 className="text-sm font-semibold text-slate-300 mb-3">Counters</h2>
        <div className="flex flex-col gap-1.5 mb-3">
          {counters.map(c => (
            <div key={c.id} className={`flex items-center gap-3 bg-slate-800 rounded-xl px-3 py-2.5 ${c.archived ? 'opacity-40' : ''}`}>
              <span className="text-xl">{c.emoji}</span>
              <span className="flex-1 text-slate-100">{c.label}</span>
              <button
                onClick={() => dispatch({ type: c.archived ? 'UPSERT_COUNTER' : 'ARCHIVE_COUNTER', id: c.id, counter: { ...c, archived: !c.archived } })}
                className="text-xs text-slate-500 active:text-slate-300"
              >
                {c.archived ? 'Restore' : 'Archive'}
              </button>
            </div>
          ))}
        </div>
        <form onSubmit={addCounter} className="flex gap-2">
          <input
            type="text"
            value={newCounterEmoji}
            onChange={e => setNewCounterEmoji(e.target.value)}
            placeholder="🍦"
            className="w-12 bg-slate-700 text-slate-100 rounded-xl px-2 py-2 text-center outline-none"
            maxLength={2}
          />
          <input
            type="text"
            value={newCounterLabel}
            onChange={e => { setNewCounterLabel(e.target.value); if (!newCounterEmoji) setNewCounterEmoji(suggestEmoji(e.target.value)) }}
            placeholder="Counter name"
            className="flex-1 bg-slate-700 text-slate-100 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button type="submit" className="bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-semibold active:bg-indigo-600">Add</button>
        </form>
      </div>

      {/* Members */}
      <div>
        <h2 className="text-sm font-semibold text-slate-300 mb-3">Members</h2>
        <div className="flex flex-col gap-1.5 mb-3">
          {members.map(m => (
            <div key={m.id} className="flex items-center gap-3 bg-slate-800 rounded-xl px-3 py-2.5">
              <span className="flex-1 text-slate-100">{m.name}</span>
              <span className="text-xs text-slate-500 font-mono">{m.id}</span>
            </div>
          ))}
        </div>
        <form onSubmit={addMember} className="flex gap-2">
          <input
            type="text"
            value={newMemberName}
            onChange={e => setNewMemberName(e.target.value)}
            placeholder="Member name"
            className="flex-1 bg-slate-700 text-slate-100 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button type="submit" className="bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-semibold active:bg-indigo-600">Add</button>
        </form>
      </div>

      {/* QR codes */}
      {members.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-300 mb-3">Member Links & QR Codes</h2>
          <div className="flex flex-col gap-4">
            {members.map(m => (
              <QRCodeCard
                key={m.id}
                url={`${baseUrl}?member=${m.id}`}
                label={m.name}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
