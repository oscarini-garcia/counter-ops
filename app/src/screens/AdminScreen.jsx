import React, { useState } from 'react'
import { useStore, useDispatch } from '../hooks/useStore.jsx'
import QRCodeCard from '../components/QRCodeCard.jsx'

function slugify(str) {
  return str
    .normalize('NFD')                    // decompose é → e + combining accent
    .replace(/[̀-ͯ]/g, '')     // strip combining diacritics (accents)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || Date.now().toString()
}

function suggestEmoji(label) {
  const l = label.toLowerCase()
  if (l.includes('ice') || l.includes('cream') || l.includes('granit')) return '🍦'
  if (l.includes('pomada') || l.includes('cocktail')) return '🍹'
  if (l.includes('beer') || l.includes('cerve')) return '🍺'
  if (l.includes('coffee') || l.includes('café')) return '☕'
  if (l.includes('pizza')) return '🍕'
  if (l.includes('swim') || l.includes('pool')) return '🏊'
  if (l.includes('walk') || l.includes('hike')) return '🚶'
  return '🎯'
}

// Reusable row with up/down/edit/delete controls
function SortableRow({ item, index, total, onUp, onDown, onEdit, onDelete, children }) {
  return (
    <div className="flex items-center gap-2 bg-slate-800 rounded-xl px-3 py-2.5">
      {/* Reorder */}
      <div className="flex flex-col gap-0.5">
        <button
          onClick={onUp}
          disabled={index === 0}
          className="text-slate-500 disabled:opacity-20 active:text-slate-200 leading-none text-sm"
        >▲</button>
        <button
          onClick={onDown}
          disabled={index === total - 1}
          className="text-slate-500 disabled:opacity-20 active:text-slate-200 leading-none text-sm"
        >▼</button>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {children}
      </div>

      {/* Edit / Delete */}
      <div className="flex gap-1 flex-shrink-0">
        <button
          onClick={onEdit}
          className="text-xs text-slate-400 active:text-slate-100 px-2 py-1 rounded-lg bg-slate-700"
        >Edit</button>
        <button
          onClick={onDelete}
          className="text-xs text-red-400 active:text-red-200 px-2 py-1 rounded-lg bg-slate-700"
        >✕</button>
      </div>
    </div>
  )
}

// Inline edit form
function EditForm({ label: initLabel, emoji: initEmoji, showEmoji, onSave, onCancel }) {
  const [label, setLabel] = useState(initLabel)
  const [emoji, setEmoji] = useState(initEmoji || '')
  return (
    <form
      onSubmit={e => { e.preventDefault(); onSave(label.trim(), emoji.trim()) }}
      className="flex gap-2 items-center"
    >
      {showEmoji && (
        <input
          type="text"
          value={emoji}
          onChange={e => setEmoji(e.target.value)}
          className="w-10 bg-slate-600 text-slate-100 rounded-lg px-1 py-1.5 text-center text-sm outline-none"
          maxLength={2}
        />
      )}
      <input
        type="text"
        value={label}
        onChange={e => setLabel(e.target.value)}
        className="flex-1 bg-slate-600 text-slate-100 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
        autoFocus
      />
      <button type="submit" className="text-xs text-indigo-400 px-2 py-1 font-semibold">Save</button>
      <button type="button" onClick={onCancel} className="text-xs text-slate-500 px-2 py-1">✕</button>
    </form>
  )
}

export default function AdminScreen() {
  const { counters, members, entries } = useStore()
  const dispatch = useDispatch()

  const [newCounterLabel, setNewCounterLabel] = useState('')
  const [newCounterEmoji, setNewCounterEmoji] = useState('')
  const [newMemberName, setNewMemberName] = useState('')
  const [editingCounter, setEditingCounter] = useState(null) // id
  const [editingMember, setEditingMember] = useState(null)   // id
  const [showQR, setShowQR] = useState(false)
  const [showEntries, setShowEntries] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)   // { type, id }
  const [deleteEntryConfirm, setDeleteEntryConfirm] = useState(null) // entry id

  const baseUrl = window.location.origin + import.meta.env.BASE_URL.replace(/\/$/, '')

  function addCounter(e) {
    e.preventDefault()
    if (!newCounterLabel.trim()) return
    const label = newCounterLabel.trim()
    dispatch({
      type: 'UPSERT_COUNTER',
      counter: { id: slugify(label), label, emoji: newCounterEmoji.trim() || suggestEmoji(label) }
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

  function confirmDelete(type, id) {
    if (deleteConfirm?.type === type && deleteConfirm?.id === id) {
      dispatch({ type: type === 'counter' ? 'REMOVE_COUNTER' : 'REMOVE_MEMBER', id })
      setDeleteConfirm(null)
      window.dispatchEvent(new CustomEvent('counter-ops:sync'))
    } else {
      setDeleteConfirm({ type, id })
    }
  }

  return (
    <div className="px-4 py-4 flex flex-col gap-6 max-w-lg mx-auto pb-8">
      <h1 className="text-lg font-bold text-slate-100">⚙️ Admin</h1>

      {/* ── COUNTERS ── */}
      <div>
        <h2 className="text-sm font-semibold text-slate-300 mb-3">Counters</h2>
        <div className="flex flex-col gap-1.5 mb-3">
          {counters.map((c, i) => (
            <div key={c.id}>
              {editingCounter === c.id ? (
                <div className="bg-slate-800 rounded-xl px-3 py-2.5">
                  <EditForm
                    label={c.label}
                    emoji={c.emoji}
                    showEmoji
                    onSave={(label, emoji) => {
                      dispatch({ type: 'UPSERT_COUNTER', counter: { ...c, label, emoji: emoji || suggestEmoji(label) } })
                      setEditingCounter(null)
                      window.dispatchEvent(new CustomEvent('counter-ops:sync'))
                    }}
                    onCancel={() => setEditingCounter(null)}
                  />
                </div>
              ) : deleteConfirm?.type === 'counter' && deleteConfirm?.id === c.id ? (
                <div className="bg-red-900/40 border border-red-700/50 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                  <span className="text-sm text-red-200">Delete <strong>{c.label}</strong>?</span>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => setDeleteConfirm(null)} className="text-xs px-3 py-1.5 rounded-lg bg-slate-700 text-slate-200">Cancel</button>
                    <button onClick={() => confirmDelete('counter', c.id)} className="text-xs px-3 py-1.5 rounded-lg bg-red-600 text-white font-semibold">Delete</button>
                  </div>
                </div>
              ) : (
                <SortableRow
                  index={i}
                  total={counters.length}
                  onUp={() => dispatch({ type: 'REORDER_COUNTERS', from: i, to: i - 1 })}
                  onDown={() => dispatch({ type: 'REORDER_COUNTERS', from: i, to: i + 1 })}
                  onEdit={() => setEditingCounter(c.id)}
                  onDelete={() => confirmDelete('counter', c.id)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{c.emoji}</span>
                    <span className="text-sm font-medium text-slate-100">{c.label}</span>
                  </div>
                </SortableRow>
              )}
            </div>
          ))}
        </div>

        {/* Add counter */}
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
            onChange={e => {
              setNewCounterLabel(e.target.value)
              if (!newCounterEmoji) setNewCounterEmoji(suggestEmoji(e.target.value))
            }}
            placeholder="Counter name"
            className="flex-1 bg-slate-700 text-slate-100 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button type="submit" className="bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-semibold active:bg-indigo-600">
            Add
          </button>
        </form>
      </div>

      {/* ── MEMBERS ── */}
      <div>
        <h2 className="text-sm font-semibold text-slate-300 mb-3">Family members</h2>
        <div className="flex flex-col gap-1.5 mb-3">
          {members.map((m, i) => {
            const expectedId = slugify(m.name)
            const idMismatch = m.id !== expectedId
            return (
              <div key={m.id}>
                {editingMember === m.id ? (
                  <div className="bg-slate-800 rounded-xl px-3 py-2.5 flex flex-col gap-2">
                    <EditForm
                      label={m.name}
                      showEmoji={false}
                      onSave={(name) => {
                        dispatch({ type: 'UPSERT_MEMBER', member: { ...m, name } })
                        setEditingMember(null)
                        window.dispatchEvent(new CustomEvent('counter-ops:sync'))
                      }}
                      onCancel={() => setEditingMember(null)}
                    />
                    {idMismatch && (
                      <div className="flex items-center gap-2 pt-1 border-t border-slate-700">
                        <span className="text-xs text-amber-400 flex-1">
                          Link ID is <span className="font-mono">{m.id}</span> — fix to <span className="font-mono">{expectedId}</span>?
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            dispatch({ type: 'FIX_MEMBER_ID', oldId: m.id, newId: expectedId })
                            setEditingMember(null)
                            window.dispatchEvent(new CustomEvent('counter-ops:sync'))
                          }}
                          className="text-xs bg-amber-600 text-white px-3 py-1 rounded-lg font-semibold active:bg-amber-700 flex-shrink-0"
                        >
                          Fix ID
                        </button>
                      </div>
                    )}
                  </div>
                ) : deleteConfirm?.type === 'member' && deleteConfirm?.id === m.id ? (
                  <div className="bg-red-900/40 border border-red-700/50 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                    <span className="text-sm text-red-200">Delete <strong>{m.name}</strong>?</span>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => setDeleteConfirm(null)} className="text-xs px-3 py-1.5 rounded-lg bg-slate-700 text-slate-200">Cancel</button>
                      <button onClick={() => confirmDelete('member', m.id)} className="text-xs px-3 py-1.5 rounded-lg bg-red-600 text-white font-semibold">Delete</button>
                    </div>
                  </div>
                ) : (
                  <SortableRow
                    index={i}
                    total={members.length}
                    onUp={() => dispatch({ type: 'REORDER_MEMBERS', from: i, to: i - 1 })}
                    onDown={() => dispatch({ type: 'REORDER_MEMBERS', from: i, to: i + 1 })}
                    onEdit={() => setEditingMember(m.id)}
                    onDelete={() => confirmDelete('member', m.id)}
                  >
                    <div>
                      <span className="text-sm font-medium text-slate-100">{m.name}</span>
                      <span className={`text-xs ml-2 font-mono ${idMismatch ? 'text-amber-400' : 'text-slate-500'}`}>{m.id}</span>
                      {idMismatch && <span className="text-xs text-amber-400 ml-1">⚠️</span>}
                    </div>
                  </SortableRow>
                )}
              </div>
            )
          })}
        </div>

        {/* Add member */}
        <form onSubmit={addMember} className="flex gap-2">
          <input
            type="text"
            value={newMemberName}
            onChange={e => setNewMemberName(e.target.value)}
            placeholder="Member name"
            className="flex-1 bg-slate-700 text-slate-100 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button type="submit" className="bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-semibold active:bg-indigo-600">
            Add
          </button>
        </form>
      </div>

      {/* ── ENTRIES ── */}
      {entries.length > 0 && (
        <div>
          <button
            onClick={() => setShowEntries(v => !v)}
            className="w-full flex items-center justify-between bg-slate-800 rounded-xl px-4 py-3 text-sm font-medium text-slate-200 active:bg-slate-700"
          >
            <span>🗂 Entries ({entries.length})</span>
            <span className="text-slate-400">{showEntries ? '▲' : '▼'}</span>
          </button>
          {showEntries && (
            <div className="flex flex-col gap-1 mt-2 max-h-96 overflow-y-auto">
              {[...entries].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).map(e => {
                const memberName = members.find(m => m.id === e.member)?.name ?? e.member
                const counter = counters.find(c => c.id === e.counter)
                const isConfirming = deleteEntryConfirm === e.id
                return (
                  <div key={e.id} className={`rounded-xl px-3 py-2 flex items-center gap-2 ${isConfirming ? 'bg-red-900/40 border border-red-700/50' : 'bg-slate-800'}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-medium text-slate-100">{memberName}</span>
                        <span className="text-slate-500 text-xs">·</span>
                        <span className="text-sm text-slate-300">{counter?.emoji} {counter?.label ?? e.counter}</span>
                        {e.qty !== 1 && <span className="text-xs text-indigo-400 font-semibold">×{e.qty}</span>}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {new Date(e.timestamp).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        {e.note ? ` · ${e.note}` : ''}
                      </div>
                    </div>
                    {isConfirming ? (
                      <div className="flex gap-1.5 flex-shrink-0">
                        <button onClick={() => setDeleteEntryConfirm(null)} className="text-xs px-2 py-1 rounded-lg bg-slate-700 text-slate-200">Cancel</button>
                        <button
                          onClick={() => {
                            dispatch({ type: 'REMOVE_ENTRY', id: e.id })
                            setDeleteEntryConfirm(null)
                            window.dispatchEvent(new CustomEvent('counter-ops:sync'))
                          }}
                          className="text-xs px-2 py-1 rounded-lg bg-red-600 text-white font-semibold"
                        >Delete</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteEntryConfirm(e.id)}
                        className="text-slate-500 active:text-red-400 flex-shrink-0 px-1 py-1 text-lg leading-none"
                      >✕</button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── QR CODES ── */}
      {members.length > 0 && (
        <div>
          <button
            onClick={() => setShowQR(q => !q)}
            className="w-full flex items-center justify-between bg-slate-800 rounded-xl px-4 py-3 text-sm font-medium text-slate-200 active:bg-slate-700"
          >
            <span>📲 Member links & QR codes</span>
            <span className="text-slate-400">{showQR ? '▲' : '▼'}</span>
          </button>
          {showQR && (
            <div className="flex flex-col gap-4 mt-3">
              {members.map(m => (
                <QRCodeCard
                  key={m.id}
                  url={`${baseUrl}?member=${m.id}`}
                  label={m.name}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
