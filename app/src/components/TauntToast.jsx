import React, { useEffect } from 'react'
import { useStore, useDispatch } from '../hooks/useStore.jsx'

export default function TauntToast() {
  const { taunt } = useStore()
  const dispatch = useDispatch()

  useEffect(() => {
    if (!taunt) return
    const timer = setTimeout(() => dispatch({ type: 'CLEAR_TAUNT' }), 2500)
    return () => clearTimeout(timer)
  }, [taunt])

  if (!taunt) return null

  return (
    <div className="fixed top-20 left-0 right-0 flex justify-center px-4 z-40 pointer-events-none">
      <div className="bg-slate-700/95 text-slate-100 text-sm rounded-2xl px-4 py-2.5 shadow-lg">
        💬 {taunt}
      </div>
    </div>
  )
}
