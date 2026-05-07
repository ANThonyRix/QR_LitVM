'use client'

import { use } from 'react'
import { formatEther } from 'viem'
import { PayButton } from '@/components/PayButton'
import { WalletConnect } from '@/components/WalletConnect'
import { usePaymentRequest } from '@/hooks/usePaymentRequest'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export default function WidgetPage({
  params,
}: {
  params: Promise<{ requestId: string }>
}) {
  const { requestId } = use(params)
  const id = requestId as `0x${string}`
  const { request, isLoading, error, refetch } = usePaymentRequest(id)

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050816] p-4 text-sm text-white/60">
        Loading payment widget...
      </div>
    )
  }

  if (!request?.recipient || request.recipient === ZERO_ADDRESS) {
    if (error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#050816] p-4">
          <div className="w-full max-w-[560px] space-y-4 rounded-[28px] border border-white/10 bg-[#09101d] p-6 text-sm text-amber-200 shadow-[0_30px_90px_rgba(2,6,23,.55)]">
            <p className="text-base font-semibold text-white">Unable to load payment request.</p>
            <p className="break-words rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-xs text-amber-100/90">
              {(error as Error).message}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-xl border border-amber-300/25 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-white/10"
            >
              Retry
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050816] p-4">
        <div className="w-full max-w-[560px] rounded-[28px] border border-white/10 bg-[#09101d] p-6 text-sm text-red-300 shadow-[0_30px_90px_rgba(2,6,23,.55)]">
          Request not found
        </div>
      </div>
    )
  }

  const amount = request.amount ?? 0n
  const amountDisplay = amount > 0n ? `${formatEther(amount)} zkLTC` : 'Any amount'
  const isClosed = !request.reusable && request.paid

  if (isClosed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050816] p-4">
        <div className="w-full max-w-[560px] rounded-[28px] border border-emerald-400/15 bg-[#09101d] p-6 shadow-[0_30px_90px_rgba(2,6,23,.55)]">
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-4 text-sm font-medium text-emerald-300">
            <span className="text-lg">✓</span>
            <span>Paid {amountDisplay}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050816] p-4 font-sans text-white">
      <div className="mx-auto w-full max-w-[560px] rounded-[28px] border border-white/10 bg-[#09101d] p-5 shadow-[0_30px_90px_rgba(2,6,23,.55)]">
        <div className="space-y-5">
          <div className="space-y-3">
            <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/45">
              Payment widget
            </div>
            <div className="space-y-2">
              <p className="break-words text-2xl font-semibold leading-tight text-white">{request.label}</p>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 font-medium text-blue-300">
                  {request.reusable ? 'Reusable payment link' : 'One-time payment link'}
                </span>
                {request.reusable && request.paymentCount > 0n && (
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/65">
                    {request.paymentCount.toString()} payments received
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/40">
                  Amount
                </p>
                <p className="text-4xl font-semibold leading-none text-white">{amountDisplay}</p>
              </div>
              <WalletConnect />
            </div>

            <div className="rounded-2xl border border-white/8 bg-[#0b1220] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/35">Recipient</p>
              <p className="mt-2 break-all font-mono text-sm text-white/70">{request.recipient}</p>
            </div>

            <PayButton
              requestId={id}
              fixedAmount={amount}
              isClosed={isClosed}
              reusable={request.reusable}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
