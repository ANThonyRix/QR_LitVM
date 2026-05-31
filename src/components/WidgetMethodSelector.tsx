'use client'

import { useState, type ReactNode } from 'react'
import { Wallet, QrCode } from 'lucide-react'
import { WidgetQR } from './WidgetQR'

interface WidgetMethodSelectorProps {
  /** Content shown when "Wallet" tab is active */
  children: ReactNode
  /** URL to encode in the QR code */
  qrUrl: string
}

export function WidgetMethodSelector({ children, qrUrl }: WidgetMethodSelectorProps) {
  const [method, setMethod] = useState<'wallet' | 'qr'>('wallet')

  return (
    <div className="space-y-4">
      {/* Tab switcher */}
      <div className="flex gap-2 rounded-xl border border-white/8 bg-white/[0.03] p-1">
        <button
          type="button"
          onClick={() => setMethod('wallet')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
            method === 'wallet'
              ? 'bg-white/10 text-white shadow-sm'
              : 'text-white/50 hover:text-white/75'
          }`}
        >
          <Wallet size={16} />
          <span>Wallet</span>
        </button>
        <button
          type="button"
          onClick={() => setMethod('qr')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
            method === 'qr'
              ? 'bg-white/10 text-white shadow-sm'
              : 'text-white/50 hover:text-white/75'
          }`}
        >
          <QrCode size={16} />
          <span>QR Code</span>
        </button>
      </div>

      {/* Content */}
      {method === 'wallet' ? children : <WidgetQR url={qrUrl} />}
    </div>
  )
}
