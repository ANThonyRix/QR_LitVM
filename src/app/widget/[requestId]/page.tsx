'use client'

import { use, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { formatEther, formatUnits } from 'viem'
import { CheckCircle2 } from 'lucide-react'
import { PayButton } from '@/components/PayButton'
import { WalletConnect } from '@/components/WalletConnect'
import { WidgetMethodSelector } from '@/components/WidgetMethodSelector'
import { usePaymentRequest } from '@/hooks/usePaymentRequest'
import { getTokenByAddress, isNativeToken } from '@/lib/tokens'
import { isValidBytes32 } from '@/lib/validation'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const WIDGET_RESIZE_MESSAGE = 'pay-litvm:widget-resize'

function postWidgetHeight(requestId: `0x${string}`) {
  if (typeof window === 'undefined') {
    return
  }

  const height = Math.max(
    document.documentElement.scrollHeight,
    document.body.scrollHeight,
  )

  // Use document.referrer origin when available, fall back to '*' for first load
  let targetOrigin = '*'
  try {
    if (document.referrer) {
      const url = new URL(document.referrer)
      targetOrigin = url.origin
    }
  } catch {
    // Invalid referrer — keep wildcard
  }

  window.parent.postMessage(
    {
      type: WIDGET_RESIZE_MESSAGE,
      requestId,
      height,
    },
    targetOrigin,
  )
}

export default function WidgetPage({
  params,
}: {
  params: Promise<{ requestId: string }>
}) {
  const { requestId } = use(params)
  const searchParams = useSearchParams()
  const id = isValidBytes32(requestId) ? requestId : null
  const { request, isLoading, error, refetch } = usePaymentRequest(id!)
  const isButtonMode = searchParams.get('view') === 'button'
  const [isExpanded, setIsExpanded] = useState(!isButtonMode)

  useEffect(() => {
    setIsExpanded(!isButtonMode)
  }, [isButtonMode])

  useEffect(() => {
    if (typeof window === 'undefined' || !id) {
      return
    }

    const notifyParent = () => postWidgetHeight(id)
    notifyParent()

    const resizeObserver = new ResizeObserver(() => notifyParent())
    resizeObserver.observe(document.documentElement)
    resizeObserver.observe(document.body)

    window.addEventListener('load', notifyParent)
    window.addEventListener('resize', notifyParent)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('load', notifyParent)
      window.removeEventListener('resize', notifyParent)
    }
  }, [id, isExpanded, isLoading, error, request])

  const shellClassName = isButtonMode
    ? 'bg-[#050816] p-0 font-sans text-white'
    : 'min-h-screen bg-[#050816] p-4 font-sans text-white'

  if (!id) {
    return (
      <div className={shellClassName}>
        <div className="mx-auto w-full max-w-[560px] rounded-[28px] border border-white/10 bg-[#09101d] p-6 text-sm text-red-300 shadow-[0_30px_90px_rgba(2,6,23,.55)]">
          Invalid payment request ID
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={shellClassName}>
        <div className="mx-auto w-full max-w-[560px] rounded-[28px] border border-white/10 bg-[#09101d] p-6 text-sm text-white/60 shadow-[0_30px_90px_rgba(2,6,23,.55)]">
          Loading payment widget...
        </div>
      </div>
    )
  }

  if (!request?.recipient || request.recipient === ZERO_ADDRESS) {
    if (error) {
      return (
        <div className={shellClassName}>
          <div className="mx-auto w-full max-w-[560px] space-y-4 rounded-[28px] border border-white/10 bg-[#09101d] p-6 text-sm text-amber-200 shadow-[0_30px_90px_rgba(2,6,23,.55)]">
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
      <div className={shellClassName}>
        <div className="mx-auto w-full max-w-[560px] rounded-[28px] border border-white/10 bg-[#09101d] p-6 text-sm text-red-300 shadow-[0_30px_90px_rgba(2,6,23,.55)]">
          Request not found
        </div>
      </div>
    )
  }

  const amount = request.amount ?? 0n
  const token = getTokenByAddress(request.token ?? null)
  const isNative = isNativeToken(request.token)
  const amountDisplay = amount > 0n
    ? `${isNative ? formatEther(amount) : formatUnits(amount, token.decimals)} ${token.symbol}`
    : 'Any amount'
  const isClosed = !request.reusable && request.paid

  if (isClosed) {
    return (
      <div className={shellClassName}>
        <div className="mx-auto w-full max-w-[560px] rounded-[28px] border border-emerald-400/15 bg-[#09101d] p-6 shadow-[0_30px_90px_rgba(2,6,23,.55)]">
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-4 text-sm font-medium text-emerald-300">
            <CheckCircle2 size={18} />
            <span className="font-mono tabular-nums">Paid {amountDisplay}</span>
          </div>
        </div>
      </div>
    )
  }

  if (isButtonMode && !isExpanded) {
    return (
      <div className={shellClassName}>
        <div className="mx-auto w-full max-w-[560px] rounded-[24px] border border-white/10 bg-[#09101d] p-4 shadow-[0_24px_80px_rgba(2,6,23,.45)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <p className="break-words text-base font-semibold text-white">{request.label}</p>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/70">
                  {amountDisplay}
                </span>
                <span className="rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-blue-300">
                  {request.reusable ? 'Donation / reusable' : 'Payment'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Open payment form
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={shellClassName}>
      <div className="mx-auto w-full max-w-[560px] rounded-[28px] border border-white/10 bg-[#09101d] p-5 shadow-[0_30px_90px_rgba(2,6,23,.55)]">
        <div className="space-y-5">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/45">
                Payment widget
              </div>
              {isButtonMode && (
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white"
                >
                  Close
                </button>
              )}
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
                <p className="font-mono text-4xl font-semibold leading-none tabular-nums text-white">{amountDisplay}</p>
              </div>
            </div>

            <WidgetMethodSelector
              qrUrl={typeof window !== 'undefined' ? `${window.location.origin}/pay/${requestId}` : ''}
            >
              <div className="space-y-4">
                <WalletConnect />

                <div className="rounded-2xl border border-white/8 bg-[#0b1220] px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/35">Recipient</p>
                  <p className="mt-2 break-all font-mono text-sm text-white/70">{request.recipient}</p>
                </div>

                <PayButton
                  requestId={id}
                  fixedAmount={amount}
                  isClosed={isClosed}
                  reusable={request.reusable}
                  tokenAddress={request.token}
                />
              </div>
            </WidgetMethodSelector>
          </div>
        </div>
      </div>
    </div>
  )
}
