import React, { useEffect } from 'react'
import { useStore, useDispatch } from '../hooks/useStore.jsx'
import { checkMilestones } from '../lib/gamification.js'

export default function ConfettiOverlay() {
  const { entries, counters, milestonesFired, milestoneQueue } = useStore()
  const dispatch = useDispatch()

  // Check for new milestones when entries or counters change
  useEffect(() => {
    const triggered = checkMilestones(entries, counters, milestonesFired)
    for (const m of triggered) {
      dispatch({ type: 'PUSH_MILESTONE', milestone: m })
    }
  }, [entries.length])

  // Fire confetti when milestone queue has items
  useEffect(() => {
    if (!milestoneQueue?.length) return

    const milestone = milestoneQueue[0]
    let cancelled = false

    import('canvas-confetti').then(({ default: confetti }) => {
      if (cancelled) return
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, disableForReducedMotion: true })
    })

    const timer = setTimeout(() => {
      dispatch({ type: 'POP_MILESTONE' })
    }, 2500)

    return () => { cancelled = true; clearTimeout(timer) }
  }, [milestoneQueue?.length])

  if (!milestoneQueue?.length) return null

  const { counter, threshold } = milestoneQueue[0]

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="bg-slate-800/90 rounded-3xl px-6 py-5 text-center shadow-2xl mx-6">
        <div className="text-5xl mb-2">🎉</div>
        <div className="text-xl font-bold text-slate-100">{threshold} {counter?.label ?? ''} {counter?.emoji ?? ''}!</div>
        <div className="text-sm text-slate-400 mt-1">Family milestone reached</div>
      </div>
    </div>
  )
}
