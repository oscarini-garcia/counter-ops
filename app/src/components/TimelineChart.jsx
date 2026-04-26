import React from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export default function TimelineChart({ entries, filterMember }) {
  const filtered = filterMember ? entries.filter(e => e.member === filterMember) : entries

  // Group by day
  const byDay = {}
  for (const e of filtered) {
    const day = new Date(e.timestamp).toLocaleDateString([], { day: 'numeric', month: 'short' })
    byDay[day] = (byDay[day] || 0) + (e.qty || 1)
  }

  const data = Object.entries(byDay).map(([day, total]) => ({ day, total }))
  const max = Math.max(...data.map(d => d.total), 1)

  if (data.length === 0) return <div className="text-center text-slate-500 py-6 text-sm">No data</div>

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: '#f1f5f9' }}
          itemStyle={{ color: '#818cf8' }}
        />
        <Bar dataKey="total" radius={[4, 4, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.total === max ? '#6366f1' : '#334155'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
