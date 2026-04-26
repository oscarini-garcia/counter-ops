import React from 'react'
import { useStore } from '../hooks/useStore.jsx'

const COLOURS = ['#6366f1','#ec4899','#f59e0b','#22c55e','#06b6d4','#f97316','#a855f7','#14b8a6']

function colourFor(id) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffffffff
  return COLOURS[Math.abs(h) % COLOURS.length]
}

export default function MemberAvatar({ member, memberId, size = 'md', showBadges = true }) {
  const { entries } = useStore()
  const id = memberId || member?.id || '?'
  const name = member?.name || id
  const initials = name.slice(0, 2).toUpperCase()
  const colour = colourFor(id)

  const dim = size === 'sm' ? 32 : size === 'lg' ? 56 : 40

  // Personal tally badge
  const tally = entries.filter(e => e.member === id).reduce((s, e) => s + (e.qty || 1), 0)

  return (
    <div className="relative inline-flex flex-col items-center gap-0.5" style={{ width: dim }}>
      {/* Avatar */}
      <div
        className="rounded-2xl overflow-hidden flex items-center justify-center font-bold text-white flex-shrink-0"
        style={{ width: dim, height: dim, background: member?.avatar ? undefined : colour, fontSize: dim * 0.38 }}
      >
        {member?.avatar
          ? <img src={member.avatar} alt={name} className="w-full h-full object-cover" />
          : initials
        }
      </div>

      {/* Badges */}
      {showBadges && (
        <>
          {tally > 0 && (
            <span className="absolute -top-1 -right-1 bg-indigo-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 leading-none">
              {tally}
            </span>
          )}
        </>
      )}
    </div>
  )
}
