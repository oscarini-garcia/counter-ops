import React from 'react'

const SIZES = {
  sm: { box: 32, font: 13, radius: 10 },
  md: { box: 44, font: 17, radius: 14 },
  lg: { box: 56, font: 21, radius: 16 },
}

export default function MemberAvatar({ member, memberId, size = 'md', showBadges = false }) {
  const s = SIZES[size] ?? SIZES.md
  const initials = member?.name
    ? member.name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : (memberId ?? '?').slice(0, 2).toUpperCase()

  // Generate a stable hue from the member id
  const hue = Array.from(memberId ?? '').reduce((h, c) => h + c.charCodeAt(0), 0) % 360

  return (
    <div
      style={{
        width: s.box, height: s.box, borderRadius: s.radius,
        overflow: 'hidden', flexShrink: 0, position: 'relative',
        background: member?.avatar ? 'transparent' : `hsl(${hue},55%,72%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {member?.avatar
        ? <img src={member.avatar} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <span style={{ fontSize: s.font, fontWeight: 800, color: `hsl(${hue},40%,28%)`, lineHeight: 1 }}>{initials}</span>
      }
    </div>
  )
}
