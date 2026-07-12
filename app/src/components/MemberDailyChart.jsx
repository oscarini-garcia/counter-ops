import React from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

// Fixed categorical palette, assigned to counters in display order and
// validated for CVD separation and contrast on the light surface.
// Counters beyond the palette fold into "Otros" — hues are never cycled.
export const SERIES_COLORS = ['#e8613a', '#0891b2', '#7c3aed', '#15803d', '#be185d']
const OTHER_COLOR = '#8a7166'

const qty = e => e.qty || 1

export default function MemberDailyChart({ entries, counters }) {
  if (!entries.length) return null

  const withData = counters.filter(c => entries.some(e => e.counter === c.id))
  const main = withData.slice(0, SERIES_COLORS.length)
  const rest = withData.slice(SERIES_COLORS.length)

  // Continuous day span from first to last entry, so quiet days show as gaps
  const stamps = entries.map(e => new Date(e.timestamp).setHours(0, 0, 0, 0))
  const first = new Date(Math.min(...stamps))
  const last  = new Date(Math.max(...stamps))
  const todayKey = new Date().toDateString()

  const data = []
  for (let d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) {
    const key = d.toDateString()
    const dayEntries = entries.filter(e => new Date(e.timestamp).toDateString() === key)
    const row = {
      day: key === todayKey ? 'hoy' : d.toLocaleDateString([], { day: 'numeric', month: 'short' }),
    }
    for (const c of main) {
      row[c.id] = dayEntries.filter(e => e.counter === c.id).reduce((s, e) => s + qty(e), 0)
    }
    if (rest.length) {
      row.__otros = dayEntries.filter(e => rest.some(c => c.id === e.counter)).reduce((s, e) => s + qty(e), 0)
    }
    data.push(row)
  }

  const series = [
    ...main.map((c, i) => ({ key: c.id, name: `${c.emoji} ${c.label}`, color: SERIES_COLORS[i] })),
    ...(rest.length ? [{ key: '__otros', name: 'Otros', color: OTHER_COLOR }] : []),
  ]

  return (
    <div>
      <ResponsiveContainer width="100%" height={170}>
        <BarChart data={data} margin={{ top: 6, right: 4, left: -26, bottom: 0 }}>
          <XAxis dataKey="day" tick={{ fill: '#9a5630', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#9a5630', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip
            cursor={{ fill: 'rgba(200,90,50,0.06)' }}
            contentStyle={{
              background: 'var(--c-surface)', border: '1px solid rgba(200,90,50,0.25)',
              borderRadius: 10, fontSize: 12, color: 'var(--c-text)',
            }}
            labelStyle={{ color: 'var(--c-text)', fontWeight: 700 }}
            itemStyle={{ color: 'var(--c-text)' }}
          />
          {series.map(s => (
            <Bar
              key={s.key}
              dataKey={s.key}
              stackId="day"
              name={s.name}
              fill={s.color}
              stroke="var(--c-surface)"
              strokeWidth={1}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
      {series.length >= 2 && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 px-1">
          {series.map(s => (
            <span key={s.key} className="inline-flex items-center gap-1 text-[10px] font-bold" style={{ color: 'var(--c-text-muted)' }}>
              <span className="inline-block w-2 h-2 rounded-sm" style={{ background: s.color }} />
              {s.name}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
