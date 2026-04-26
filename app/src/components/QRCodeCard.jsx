import React from 'react'
import { QRCodeSVG } from 'qrcode.react'

export default function QRCodeCard({ url, label }) {
  return (
    <div className="flex flex-col items-center gap-2 bg-slate-700 rounded-2xl p-4">
      <div className="bg-white p-2 rounded-xl">
        <QRCodeSVG value={url} size={160} />
      </div>
      <span className="text-sm font-medium text-slate-200">{label}</span>
      <a href={url} className="text-xs text-slate-400 break-all text-center">{url}</a>
    </div>
  )
}
