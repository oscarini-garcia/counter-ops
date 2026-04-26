import React from 'react'
import { QRCodeSVG } from 'qrcode.react'

export default function QRCodeCard({ url, label }) {
  return (
    <div
      className="flex flex-col items-center gap-2 rounded-2xl p-4"
      style={{ background: 'var(--c-surface-2)', border: '1px solid var(--c-border)' }}
    >
      <div className="bg-white p-2 rounded-xl">
        <QRCodeSVG value={url} size={160} />
      </div>
      <span className="text-sm font-medium" style={{ color: 'var(--c-text)' }}>{label}</span>
      <a href={url} className="text-xs break-all text-center" style={{ color: 'var(--c-text-muted)' }}>{url}</a>
    </div>
  )
}
