'use client'

import { use, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAccount } from 'wagmi'
import { isAddress } from 'viem'
import { TOKENS, TokenConfig } from '@/lib/tokens'
import { validatePaymentAmount } from '@/lib/validation'
import { useDirectPayment } from '@/hooks/useDirectPayment'
import { WalletConnect } from '@/components/WalletConnect'

const WIDGET_RESIZE_MESSAGE = 'pay-litvm:widget-resize'

function postWidgetHeight(address: string) {
  if (typeof window === 'undefined') return

  const height = Math.max(
    document.documentElement.scrollHeight,
    document.body.scrollHeight,
  )

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
    { type: WIDGET_RESIZE_MESSAGE, address, height },
    targetOrigin,
  )
}

function getAvailableTokens(tokensParam: string | null): TokenConfig[] {
  switch (tokensParam?.toLowerCase()) {
    case 'zkltc':
      return TOKENS.filter(t => t.symbol === 'zkLTC')
    case 'usdc':
      return TOKENS.filter(t => t.symbol === 'USDC')
    default:
      return TOKENS // all
  }
}

function getStatusText(status: string) {
  switch (status) {
    case 'preparing_wallet':
      return 'Checking wallet network...'
    case 'confirm_create':
      return 'Confirm receipt creation in your wallet...'
    case 'waiting_create':
      return 'Creating payment receipt on-chain...'
    case 'confirm_approve':
      return 'Confirm token approval in your wallet...'
    case 'waiting_approve':
      return 'Approving token...'
    case 'confirm_payment':
      return 'Confirm the payment in your wallet...'
    case 'waiting_payment':
      return 'Sending payment...'
    case 'success':
      return 'Payment sent!'
    default:
      return ''
  }
}

export default function MultiTokenWidgetPage({
  params,
}: {
  params: Promise<{ address: string }>
}) {
  const { address: recipientAddress } = use(params)
  const searchParams = useSearchParams()
  const { isConnected } = useAccount()
  const { sendPayment, reset, status, error, requestId, isBusy, isSuccess } = useDirectPayment()

  const amount = searchParams.get('amount') ?? ''
  const label = searchParams.get('label') ?? 'Payment'
  const tokensParam = searchParams.get('tokens')
  const availableTokens = useMemo(() => getAvailableTokens(tokensParam), [tokensParam])

  const [selectedToken, setSelectedToken] = useState<TokenConfig>(availableTokens[0])
  const [customAmount, setCustomAmount] = useState(amount)

  const isValidAddress = isAddress(recipientAddress)
  const displayAmount = amount || customAmount
  const amountError = displayAmount ? validatePaymentAmount(displayAmount) : null
  const statusText = getStatusText(status)

  // Sync selected token if available tokens change
  useEffect(() => {
    if (!availableTokens.find(t => t.symbol === selectedToken.symbol)) {
      setSelectedToken(availableTokens[0])
    }
  }, [availableTokens, selectedToken.symbol])

  // Resize notifications
  useEffect(() => {
    if (typeof window === 'undefined' || !recipientAddress) return

    const notifyParent = () => postWidgetHeight(recipientAddress)
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
  }, [recipientAddress, status, isConnected])

  const handlePay = () => {
    const finalAmount = amount || customAmount
    if (!finalAmount || !isValidAddress) return

    void sendPayment({
      recipientAddress: recipientAddress as `0x${string}`,
      amount: finalAmount,
      label,
      tokenAddress: selectedToken.address,
      tokenDecimals: selectedToken.decimals,
    })
  }

  if (!isValidAddress) {
    return (
      <div className="min-h-screen bg-[#050816] p-4 font-sans text-white">
        <div className="mx-auto w-full max-w-[560px] rounded-[28px] border border-white/10 bg-[#09101d] p-6 text-sm text-red-300 shadow-[0_30px_90px_rgba(2,6,23,.55)]">
          Invalid recipient address
        </div>
      </div>
    )
  }

  if (isSuccess) {
    const receiptUrl = requestId
      ? `${typeof window !== 'undefined' ? window.location.origin : ''}/pay/${requestId}`
      : null

    return (
      <div className="min-h-screen bg-[#050816] p-4 font-sans text-white">
        <div className="mx-auto w-full max-w-[560px] rounded-[28px] border border-emerald-400/15 bg-[#09101d] p-6 shadow-[0_30px_90px_rgba(2,6,23,.55)]">
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-4 text-sm font-medium text-emerald-300">
              <span className="text-lg">✓</span>
              <span>Paid {displayAmount} {selectedToken.symbol}</span>
            </div>
            {receiptUrl && (
              <a
                href={receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block break-all rounded-xl border border-white/8 bg-white/5 px-3 py-2 font-mono text-xs text-blue-300 transition-colors hover:text-blue-200"
              >
                {receiptUrl}
              </a>
            )}
            <button
              type="button"
              onClick={() => { reset(); setCustomAmount(amount) }}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white"
            >
              New payment
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050816] p-4 font-sans text-white">
      <div className="mx-auto w-full max-w-[560px] rounded-[28px] border border-white/10 bg-[#09101d] p-5 shadow-[0_30px_90px_rgba(2,6,23,.55)]">
        <div className="space-y-5">
          {/* Header */}
          <div className="space-y-2">
            <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/45">
              Payment
            </div>
            <p className="text-2xl font-semibold text-white">{label}</p>
          </div>

          <div className="flex flex-col gap-4 rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
            {/* Amount */}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/40">
                Amount
              </p>
              {amount ? (
                <p className="text-3xl font-semibold text-white">
                  {amount} {selectedToken.symbol}
                </p>
              ) : (
                <div className="space-y-1">
                  <input
                    type="number"
                    placeholder="0.00"
                    value={customAmount}
                    onChange={e => setCustomAmount(e.target.value)}
                    min="0.000000000000000001"
                    step="0.001"
                    disabled={isBusy}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-lg font-semibold text-white placeholder:text-white/30 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 disabled:opacity-60"
                  />
                  {customAmount && amountError && (
                    <p className="text-xs text-red-400">{amountError}</p>
                  )}
                </div>
              )}
            </div>

            {/* Token selector */}
            {availableTokens.length > 1 && (
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/40">
                  Pay with
                </p>
                <div className="flex gap-2">
                  {availableTokens.map(token => (
                    <button
                      key={token.symbol}
                      type="button"
                      onClick={() => setSelectedToken(token)}
                      disabled={isBusy}
                      className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all ${
                        selectedToken.symbol === token.symbol
                          ? 'border-blue-500/50 bg-blue-500/20 text-blue-200 shadow-[0_0_12px_rgba(59,130,246,.15)]'
                          : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                      } disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      {token.symbol}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Recipient */}
            <div className="rounded-2xl border border-white/8 bg-[#0b1220] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/35">Recipient</p>
              <p className="mt-2 break-all font-mono text-xs text-white/70">{recipientAddress}</p>
            </div>

            {/* Wallet */}
            <WalletConnect />

            {/* Status */}
            {statusText && (
              <p className={`rounded-lg px-3 py-2 text-sm ${
                isSuccess
                  ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                  : 'border border-blue-500/20 bg-blue-500/10 text-blue-200'
              }`}>
                {statusText}
              </p>
            )}

            {/* Error */}
            {error && (
              <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {error.message}
              </p>
            )}

            {/* Pay button */}
            <button
              type="button"
              onClick={handlePay}
              disabled={!isConnected || !(amount || customAmount) || !!amountError || isBusy}
              className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              style={{ background: 'linear-gradient(135deg, oklch(0.62 0.19 261), oklch(0.55 0.2 274))' }}
            >
              {isBusy
                ? 'Continue in wallet...'
                : `Pay ${displayAmount || '...'} ${selectedToken.symbol}`}
            </button>

            <p className="text-center text-[11px] text-white/30">
              Powered by Pay LitVM
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
