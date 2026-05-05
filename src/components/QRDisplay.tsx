'use client'
import { useEffect, useRef } from 'react'
import QRCodeStyling from 'qr-code-styling'
import { Button } from '@/components/ui/button'

interface QRDisplayProps {
  url: string
  label?: string
}

export function QRDisplay({ url, label }: QRDisplayProps) {
  const ref = useRef<HTMLDivElement>(null)
  const qrRef = useRef<QRCodeStyling | null>(null)

  useEffect(() => {
    if (!qrRef.current) {
      qrRef.current = new QRCodeStyling({
        width: 280,
        height: 280,
        type: 'svg',
        data: url,
        dotsOptions: { color: '#1a1a2e', type: 'rounded' },
        cornersSquareOptions: { type: 'extra-rounded', color: '#1a1a2e' },
        backgroundOptions: { color: '#ffffff' },
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

  const downloadSVG = () => qrRef.current?.download({ name: label ?? 'qr-litvm', extension: 'svg' })
  const downloadPNG = () => qrRef.current?.download({ name: label ?? 'qr-litvm', extension: 'png' })

  return (
    <div className="flex flex-col items-center gap-3">
      <div ref={ref} className="rounded-xl overflow-hidden shadow-lg" />
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={downloadSVG}>SVG</Button>
        <Button variant="outline" size="sm" onClick={downloadPNG}>PNG</Button>
      </div>
    </div>
  )
}
