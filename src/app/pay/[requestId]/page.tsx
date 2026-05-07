'use client'
import { use } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePaymentRequest } from '@/hooks/usePaymentRequest'
import { WalletConnect } from '@/components/WalletConnect'
import { PayButton } from '@/components/PayButton'
import { PaymentStatus } from '@/components/PaymentStatus'
import { QRDisplay } from '@/components/QRDisplay'
import { formatEther } from 'viem'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

const glassCard = {
  background: 'oklch(0.13 0.03 264 / 0.8)',
  border: '1px solid oklch(1 0 0 / 8%)',
  backdropFilter: 'blur(20px)',
  borderRadius: '16px',
} as React.CSSProperties

export default function PayPage({
  params,
}: {
  params: Promise<{ requestId: string }>
}) {
  const { requestId } = use(params)
  const id = requestId as `0x${string}`
  const { request, isLoading, error, refetch } = usePaymentRequest(id)

  const pageUrl = typeof window !== 'undefined' ? window.location.href : ''

  const bg = { background: 'oklch(0.09 0.025 264)' } as React.CSSProperties

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={bg}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
          <p className="text-white/50 text-sm">Loading...</p>
        </div>
      </main>
    )
  }

  if (!request?.recipient || request.recipient === ZERO_ADDRESS) {
    if (error) {
      return (
        <main className="min-h-screen flex items-center justify-center px-4" style={bg}>
          <div style={glassCard} className="max-w-sm w-full p-8 text-center space-y-4">
            <div className="text-4xl">⚠️</div>
            <div className="space-y-2">
              <p className="text-white">Unable to load payment request</p>
              <p className="text-sm text-white/55 break-words">{(error as Error).message}</p>
            </div>
            <button
              type="button"
              onClick={() => refetch()}
              className="w-full rounded-xl border border-white/15 bg-white/5 py-2.5 text-sm font-medium text-white/80 transition-all hover:bg-white/10"
            >
              Retry
            </button>
          </div>
        </main>
      )
    }

    return (
      <main className="min-h-screen flex items-center justify-center px-4" style={bg}>
        <div style={glassCard} className="max-w-sm w-full p-8 text-center">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-white/60">Payment request not found</p>
        </div>
      </main>
    )
  }

  const amount = request.amount ?? 0n
  const amountDisplay = amount > 0n ? `${formatEther(amount)} zkLTC` : 'Any amount'
  const isClosed = !request.reusable && request.paid

  return (
    <main className="min-h-screen relative overflow-hidden" style={bg}>
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, oklch(0.62 0.19 261), transparent 70%)' }} />
        <div className="absolute -bottom-32 -right-16 w-80 h-80 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, oklch(0.55 0.2 274), transparent 70%)' }} />
      </div>

      <div className="relative max-w-md mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden ring-1 ring-white/10">
              <Image src="/logo.png" alt="LitVM" fill className="object-cover" priority />
            </div>
            <span className="font-bold text-white text-lg">Pay LitVM</span>
          </Link>
          <WalletConnect />
        </header>

        {/* Payment card */}
        <div style={glassCard} className="p-6 space-y-5">
          <div className="space-y-1">
            <p className="text-xs text-white/40 uppercase tracking-wide">Payment request</p>
            <h1 className="text-xl font-bold text-white">{request.label}</h1>
            {request.reusable && (
              <p className="text-sm text-blue-300">Reusable payment link</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-white">{amountDisplay}</p>
            </div>
            <PaymentStatus
              paid={request.paid}
              payer={request.payer}
              reusable={request.reusable}
              paymentCount={request.paymentCount}
              totalPaid={request.totalPaid}
            />
          </div>

          <div className="rounded-xl p-3 border border-white/8"
            style={{ background: 'oklch(1 0 0 / 3%)' }}>
            <p className="text-xs text-white/40 mb-0.5">Recipient</p>
            <p className="text-xs font-mono text-white/60 break-all">{request.recipient}</p>
          </div>

          {!isClosed && (
            <PayButton
              requestId={id}
              fixedAmount={amount}
              isClosed={isClosed}
              reusable={request.reusable}
            />
          )}
        </div>

        {/* QR code */}
        {pageUrl && (
          <div style={glassCard} className="p-6 flex flex-col items-center gap-3">
            <p className="text-xs text-white/40 uppercase tracking-wide">Share QR</p>
            <QRDisplay url={pageUrl} label={request.label} />
          </div>
        )}
      </div>
    </main>
  )
}
