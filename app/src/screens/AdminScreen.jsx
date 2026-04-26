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
    <div
      className="flex items-center gap-2 rounded-xl px-3 py-2.5"
      style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
    >
      {/* Reorder */}
      <div className="flex flex-col gap-0.5">
        <button
          onClick={onUp}
          disabled={index === 0}
          className="disabled:opacity-20 active:opacity-60 leading-none text-sm"
          style={{ color: 'var(--c-text-muted)' }}
        >▲</button>
        <button
          onClick={onDown}
          disabled={index === total - 1}
          className="disabled:opacity-20 active:opacity-60 leading-none text-sm"
          style={{ color: 'var(--c-text-muted)' }}
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
          className="text-xs px-2 py-1 rounded-lg active:opacity-70"
          style={{ background: 'var(--c-surface-2)', border: '1px solid var(--c-border)', color: 'var(--c-text-muted)' }}
        >Edit</button>
        <button
          onClick={onDelete}
          className="text-xs px-2 py-1 rounded-lg active:opacity-70"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--c-danger)' }}
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
          className="w-10 rounded-lg px-1 py-1.5 text-center text-sm outline-none"
          style={{ background: 'var(--c-surface-2)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
          maxLength={2}
        />
      )}
      <input
        type="text"
        value={label}
        onChange={e => setLabel(e.target.value)}
        className="flex-1 rounded-lg px-2 py-1.5 text-sm outline-none"
        style={{ background: 'var(--c-surface-2)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
        autoFocus
      />
      <button
        type="submit"
        className="text-xs px-2 py-1 font-semibold active:opacity-70"
        style={{ color: 'var(--c-brand)' }}
      >Save</button>
      <button
        type="button"
        onClick={onCancel}
        className="text-xs px-2 py-1"
        style={{ color: 'var(--c-text-muted)' }}
      >✕</button>
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

  const inputStyle = {
    background: 'var(--c-surface)',
    border: '1.5px solid var(--c-border)',
    color: 'var(--c-text)',
  }

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
    <div className="px-4 py-4 flex flex-col gap-6 max-w-lg mx-auto pb-8" style={{ background: 'var(--c-bg)' }}>
      <h1 className="text-lg font-bold" style={{ color: 'var(--c-text)' }}>⚙️ Admin</h1>

      {/* ── COUNTERS ── */}
      <div>
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--c-text-muted)' }}>Counters</h2>
        <div className="flex flex-col gap-1.5 mb-3">
          {counters.map((c, i) => (
            <div key={c.id}>
              {editingCounter === c.id ? (
                <div
                  className="rounded-xl px-3 py-2.5"
                  style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
                >
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
                <div
                  className="rounded-xl px-4 py-3 flex items-center justify-between gap-3"
                  style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}
                >
                  <span className="text-sm" style={{ color: 'var(--c-danger)' }}>Delete <strong>{c.label}</strong>?</span>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="text-xs px-3 py-1.5 rounded-lg active:opacity-70"
                      style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
                    >Cancel</button>
                    <button
                      onClick={() => confirmDelete('counter', c.id)}
                      className="text-xs px-3 py-1.5 rounded-lg font-semibold active:opacity-80"
                      style={{ background: 'var(--c-danger)', color: '#fff' }}
                    >Delete</button>
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
                    <span className="text-sm font-medium" style={{ color: 'var(--c-text)' }}>{c.label}</span>
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
            className="w-12 rounded-xl px-2 py-2 text-center outline-none"
            style={inputStyle}
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
            className="flex-1 rounded-xl px-3 py-2 text-sm outline-none"
            style={inputStyle}
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl text-sm font-semibold active:opacity-80"
            style={{ background: 'var(--c-brand)', color: '#fff' }}
          >
            Add
          </button>
        </form>
      </div>

      {/* ── MEMBERS ── */}
      <div>
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--c-text-muted)' }}>Family members</h2>
        <div className="flex flex-col gap-1.5 mb-3">
          {members.map((m, i) => {
            const expectedId = slugify(m.name)
            const idMismatch = m.id !== expectedId
            return (
              <div key={m.id}>
                {editingMember === m.id ? (
                  <div
                    className="rounded-xl px-3 py-2.5 flex flex-col gap-2"
                    style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
                  >
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
                      <div
                        className="flex items-center gap-2 pt-1"
                        style={{ borderTop: '1px solid var(--c-border)' }}
                      >
                        <span className="text-xs flex-1" style={{ color: 'var(--c-warning)' }}>
                          Link ID is <span className="font-mono">{m.id}</span> — fix to <span className="font-mono">{expectedId}</span>?
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            dispatch({ type: 'FIX_MEMBER_ID', oldId: m.id, newId: expectedId })
                            setEditingMember(null)
                            window.dispatchEvent(new CustomEvent('counter-ops:sync'))
                          }}
                          className="text-xs px-3 py-1 rounded-lg font-semibold active:opacity-80 flex-shrink-0"
                          style={{ background: 'var(--c-warning)', color: '#fff' }}
                        >
                          Fix ID
                        </button>
                      </div>
                    )}
                  </div>
                ) : deleteConfirm?.type === 'member' && deleteConfirm?.id === m.id ? (
                  <div
                    className="rounded-xl px-4 py-3 flex items-center justify-between gap-3"
                    style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}
                  >
                    <span className="text-sm" style={{ color: 'var(--c-danger)' }}>Delete <strong>{m.name}</strong>?</span>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="text-xs px-3 py-1.5 rounded-lg active:opacity-70"
                        style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
                      >Cancel</button>
                      <button
                        onClick={() => confirmDelete('member', m.id)}
                        className="text-xs px-3 py-1.5 rounded-lg font-semibold active:opacity-80"
                        style={{ background: 'var(--c-danger)', color: '#fff' }}
                      >Delete</button>
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
                      <span className="text-sm font-medium" style={{ color: 'var(--c-text)' }}>{m.name}</span>
                      <span
                        className="text-xs ml-2 font-mono"
                        style={{ color: idMismatch ? 'var(--c-warning)' : 'var(--c-text-muted)' }}
                      >{m.id}</span>
                      {idMismatch && <span className="text-xs ml-1">⚠️</span>}
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
            className="flex-1 rounded-xl px-3 py-2 text-sm outline-none"
            style={inputStyle}
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl text-sm font-semibold active:opacity-80"
            style={{ background: 'var(--c-brand)', color: '#fff' }}
          >
            Add
          </button>
        </form>
      </div>

      {/* ── ENTRIES ── */}
      {entries.length > 0 && (
        <div>
          <button
            onClick={() => setShowEntries(v => !v)}
            className="w-full flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium active:opacity-80"
            style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
          >
            <span>🗂 Entries ({entries.length})</span>
            <span style={{ color: 'var(--c-text-muted)' }}>{showEntries ? '▲' : '▼'}</span>
          </button>
          {showEntries && (
            <div className="flex flex-col gap-1 mt-2 max-h-96 overflow-y-auto">
              {[...entries].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).map(e => {
                const memberName = members.find(m => m.id === e.member)?.name ?? e.member
                const counter = counters.find(c => c.id === e.counter)
                const isConfirming = deleteEntryConfirm === e.id
                return (
                  <div
                    key={e.id}
                    className="rounded-xl px-3 py-2 flex items-center gap-2"
                    style={
                      isConfirming
                        ? { background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }
                        : { background: 'var(--c-surface)', border: '1px solid var(--c-border)' }
                    }
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-medium" style={{ color: 'var(--c-text)' }}>{memberName}</span>
                        <span className="text-xs" style={{ color: 'var(--c-text-muted)' }}>·</span>
                        <span className="text-sm" style={{ color: 'var(--c-text)' }}>{counter?.emoji} {counter?.label ?? e.counter}</span>
                        {e.qty !== 1 && (
                          <span className="text-xs font-semibold" style={{ color: 'var(--c-brand)' }}>×{e.qty}</span>
                        )}
                      </div>
                      <div className="text-xs mt-0.5 flex items-center gap-1.5 flex-wrap" style={{ color: 'var(--c-text-muted)' }}>
                        <span>{new Date(e.timestamp).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                        {e.rating && <span>{'⭐'.repeat(e.rating)}</span>}
                        {e.note && <span className="italic">"{e.note}"</span>}
                      </div>
                    </div>
                    {isConfirming ? (
                      <div className="flex gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => setDeleteEntryConfirm(null)}
                          className="text-xs px-2 py-1 rounded-lg active:opacity-70"
                          style={{ background: 'var(--c-surface-2)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
                        >Cancel</button>
                        <button
                          onClick={() => {
                            dispatch({ type: 'REMOVE_ENTRY', id: e.id })
                            setDeleteEntryConfirm(null)
                            window.dispatchEvent(new CustomEvent('counter-ops:sync'))
                          }}
                          className="text-xs px-2 py-1 rounded-lg font-semibold active:opacity-80"
                          style={{ background: 'var(--c-danger)', color: '#fff' }}
                        >Delete</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteEntryConfirm(e.id)}
                        className="flex-shrink-0 px-1 py-1 text-lg leading-none active:opacity-60"
                        style={{ color: 'var(--c-text-muted)' }}
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
            className="w-full flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium active:opacity-80"
            style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
          >
            <span>📲 Member links & QR codes</span>
            <span style={{ color: 'var(--c-text-muted)' }}>{showQR ? '▲' : '▼'}</span>
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
