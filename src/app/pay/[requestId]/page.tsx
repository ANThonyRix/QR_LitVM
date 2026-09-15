'use client'
import { use, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useAccount } from 'wagmi'
import { AlertTriangle, SearchX } from 'lucide-react'
import { usePaymentRequest } from '@/hooks/usePaymentRequest'
import { useRequestPayments } from '@/hooks/useRequestPayments'
import { getTokenByAddress, isNativeToken } from '@/lib/tokens'
import { isValidBytes32 } from '@/lib/validation'
import { WalletConnect } from '@/components/WalletConnect'
import { PayButton } from '@/components/PayButton'
import { PaymentStatus } from '@/components/PaymentStatus'
import { QRDisplay } from '@/components/QRDisplay'
import { formatEther, formatUnits } from 'viem'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export default function PayPage({
  params,
}: {
  params: Promise<{ requestId: string }>
}) {
  const { requestId } = use(params)
  const id = isValidBytes32(requestId) ? requestId : null
  const { address } = useAccount()
  const { request, isLoading, error, refetch } = usePaymentRequest(id!)
  const { payments } = useRequestPayments(id!, request?.paymentCount)
  const [showPayments, setShowPayments] = useState(false)

  const myPayments = address
    ? payments.filter(p => p.payer.toLowerCase() === address.toLowerCase())
    : []

  const pageUrl = typeof window !== 'undefined' ? window.location.href : ''

  if (!id) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm space-y-3 rounded-2xl border border-border bg-card p-8 text-center">
          <AlertTriangle className="mx-auto text-destructive" size={28} />
          <p className="text-muted-foreground">Invalid payment request ID</p>
          <Link href="/" className="inline-block text-sm text-primary hover:underline">
            Back to Pay LitVM
          </Link>
        </div>
      </main>
    )
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </main>
    )
  }

  if (!request?.recipient || request.recipient === ZERO_ADDRESS) {
    if (error) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-background px-4">
          <div className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-card p-8 text-center">
            <AlertTriangle className="mx-auto text-destructive" size={28} />
            <div className="space-y-2">
              <p className="text-foreground">Unable to load payment request</p>
              <p className="break-words text-sm text-muted-foreground">{(error as Error).message}</p>
            </div>
            <button
              type="button"
              onClick={() => refetch()}
              className="w-full rounded-xl border border-border bg-white/5 py-2.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-white/10"
            >
              Retry
            </button>
          </div>
        </main>
      )
    }

    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm space-y-3 rounded-2xl border border-border bg-card p-8 text-center">
          <SearchX className="mx-auto text-muted-foreground" size={28} />
          <p className="text-muted-foreground">Payment request not found</p>
          <Link href="/" className="inline-block text-sm text-primary hover:underline">
            Back to Pay LitVM
          </Link>
        </div>
      </main>
    )
  }

  const token = getTokenByAddress(request.token)
  const isNative = isNativeToken(request.token)
  const amount = request.amount ?? 0n
  const amountDisplay = amount > 0n
    ? `${isNative ? formatEther(amount) : formatUnits(amount, token.decimals)} ${token.symbol}`
    : 'Any amount'
  const isClosed = !request.reusable && request.paid

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-md space-y-6 px-4 py-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="relative h-8 w-8 overflow-hidden rounded-lg border border-border">
              <Image src="/logo.png" alt="Pay LitVM" fill className="object-cover" priority unoptimized />
            </div>
            <span className="text-lg font-bold text-foreground">Pay LitVM</span>
          </Link>
          <WalletConnect />
        </header>

        {/* Payment card */}
        <div className="space-y-5 rounded-2xl border border-border bg-card p-6">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Payment request</p>
            <h1 className="text-xl font-bold text-foreground">{request.label}</h1>
            {request.reusable && (
              <p className="text-sm text-primary">Reusable payment link</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-3xl font-bold tabular-nums text-foreground">{amountDisplay}</p>
              {!isNative && (
                <p className="mt-1 text-xs text-muted-foreground">ERC-20 token payment</p>
              )}
            </div>
            <PaymentStatus
              paid={request.paid}
              payer={request.payer}
              reusable={request.reusable}
              paymentCount={request.paymentCount}
              totalPaid={request.totalPaid}
              tokenAddress={request.token}
            />
          </div>

          <div className="rounded-xl border border-border bg-white/[0.03] p-3">
            <p className="mb-0.5 text-xs text-muted-foreground">Recipient</p>
            <p className="break-all font-mono text-xs text-foreground/80">{request.recipient}</p>
          </div>

          {request.payoutAddress && request.payoutAddress !== request.recipient && request.payoutAddress !== ZERO_ADDRESS && (
            <div className="rounded-xl border border-amber-500/15 bg-white/[0.03] p-3">
              <p className="mb-0.5 text-xs text-amber-200/70">Fallback payout address</p>
              <p className="break-all font-mono text-xs text-amber-100/80">{request.payoutAddress}</p>
            </div>
          )}

          {!isClosed && (
            <PayButton
              requestId={id}
              fixedAmount={amount}
              isClosed={isClosed}
              reusable={request.reusable}
              tokenAddress={request.token}
            />
          )}
        </div>

        {myPayments.length > 0 && (
          <div className="space-y-3 rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">My payments</p>
              <button
                type="button"
                onClick={() => setShowPayments(v => !v)}
                className="rounded-xl border border-border bg-white/5 px-3 py-1.5 text-xs font-medium text-foreground/70 transition-colors hover:bg-white/10 hover:text-foreground"
              >
                {showPayments ? 'Hide' : `Show (${myPayments.length})`}
              </button>
            </div>

            {showPayments && (
              <div className="space-y-2">
                {myPayments.map((payment, index) => (
                  <div
                    key={`${payment.payer}-${payment.paidAt.toString()}-${index}`}
                    className="rounded-xl border border-border bg-white/[0.03] px-3 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-mono text-sm font-semibold tabular-nums text-foreground">
                          {isNative ? formatEther(payment.amount) : formatUnits(payment.amount, token.decimals)} {token.symbol}
                        </p>
                        <a
                          href={`https://liteforge.explorer.caldera.xyz/address/${payment.payer}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 block break-all font-mono text-xs text-primary/70 transition-colors hover:text-primary"
                        >
                          {payment.payer}
                        </a>
                      </div>
                      <p className="shrink-0 text-right text-xs text-muted-foreground">
                        {new Date(Number(payment.paidAt) * 1000).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* QR code */}
        {pageUrl && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Share QR</p>
            <QRDisplay url={pageUrl} label={request.label} />
          </div>
        )}
      </div>
    </main>
  )
}
