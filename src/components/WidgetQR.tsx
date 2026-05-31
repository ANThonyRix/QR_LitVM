'use client'

import { useEffect, useRef } from 'react'
import QRCodeStyling from 'qr-code-styling'

interface WidgetQRProps {
  url: string
}

export function WidgetQR({ url }: WidgetQRProps) {
  const ref = useRef<HTMLDivElement>(null)
  const qrRef = useRef<QRCodeStyling | null>(null)

  useEffect(() => {
    if (!qrRef.current) {
      qrRef.current = new QRCodeStyling({
        width: 200,
        height: 200,
        type: 'svg',
        data: url,
        dotsOptions: { color: '#ffffff', type: 'rounded' },
        cornersSquareOptions: { type: 'extra-rounded', color: '#ffffff' },
        cornersDotOptions: { color: '#60a5fa' },
        backgroundOptions: { color: 'transparent' },
        qrOptions: { errorCorrectionLevel: 'H' },
      })
    }
    if (ref.current) {
      ref.current.innerHTML = ''
      qrRef.current.append(ref.current)
    }
  }, [])

  useEffect(() => {
    qrRef.current?.update({ data: url })
  }, [url])

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        ref={ref}
        className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-3"
      />
      <p className="text-center text-xs text-white/50">
        Scan with your phone to pay from mobile wallet
      </p>
    </div>
  )
}
