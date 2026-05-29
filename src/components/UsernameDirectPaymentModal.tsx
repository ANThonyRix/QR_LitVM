'use client'

import { useMemo, useState } from 'react'
import { useAccount } from 'wagmi'
import { isBandwidthLimitError } from '@/lib/litvmNetwork'
import { validatePaymentAmount } from '@/lib/validation'
import { useDirectPayment } from '@/hooks/useDirectPayment'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { WalletRpcRecoveryNotice } from './WalletRpcRecoveryNotice'

const glassCard = {
  background: 'oklch(0.13 0.03 264 / 0.94)',
  border: '1px solid oklch(1 0 0 / 8%)',
  backdropFilter: 'blur(20px)',
  borderRadius: '16px',
} as React.CSSProperties

function getStatusText(status: ReturnType<typeof useDirectPayment>['status'], username: string) {
  switch (status) {
    case 'preparing_wallet':
      return 'Checking wallet network...'
    case 'confirm_create':
      return 'Confirm receipt creation in your wallet...'
    case 'waiting_create':
      return 'Creating payment receipt on-chain...'
    case 'confirm_payment':
      return `Confirm the payment to @${username} in your wallet...`
    case 'waiting_payment':
      return `Sending payment to @${username}...`
    case 'success':
      return `Payment sent to @${username}.`
    default:
      return ''
  }
}

export function UsernameDirectPaymentModal({
  recipientAddress,
  recipientUsername,
  onClose,
}: {
  recipientAddress: `0x${string}`
  recipientUsername: string
  onClose: () => void
}) {
  const { isConnected } = useAccount()
  const { sendPayment, reset, status, error, requestId, isBusy, isSuccess } = useDirectPayment()

  const [label, setLabel] = useState('')
  const [amount, setAmount] = useState('')
  const [copied, setCopied] = useState(false)

  const receiptUrl = useMemo(() => {
    if (!requestId || typeof window === 'undefined') {
      return ''
    }

    return `${window.location.origin}/pay/${requestId}`
  }, [requestId])

  const statusText = getStatusText(status, recipientUsername)
  const amountError = validatePaymentAmount(amount)

  const closeModal = () => {
    reset()
    setLabel('')
    setAmount('')
    setCopied(false)
    onClose()
  }

  const handleSubmit = () => {
    if (!label.trim() || !amount.trim()) {
      return
    }

    void sendPayment({
      recipientAddress,
      amount,
      label: label.trim(),
    })
  }

  const copyReceiptLink = async () => {
    if (!receiptUrl) {
      return
    }

    await navigator.clipboard.writeText(receiptUrl)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 px-4 py-6 backdrop-blur-sm sm:items-center"
      onClick={event => {
        if (event.target === event.currentTarget && !isBusy) {
          closeModal()
        }
      }}
    >
      <div className="w-full max-w-xl space-y-4">
        <div style={glassCard} className="flex items-center justify-between px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-white">Send payment to @{recipientUsername}</p>
            <p className="mt-1 text-xs text-white/45">
              Add a label and amount, then send the payment directly to this wallet.
            </p>
          </div>
          <button
            type="button"
            onClick={closeModal}
            disabled={isBusy}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Close
          </button>
        </div>

        <div style={glassCard} className="space-y-5 p-6">
          <div className="rounded-xl border border-white/8 px-3 py-3" style={{ background: 'oklch(1 0 0 / 3%)' }}>
            <p className="text-xs uppercase tracking-wide text-white/40">Recipient</p>
            <p className="mt-1 text-sm font-semibold text-white">@{recipientUsername}</p>
            <p className="mt-1 break-all font-mono text-xs text-white/55">{recipientAddress}</p>
          </div>

          {!isConnected && (
            <p className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/65">
              Connect your wallet to continue.
            </p>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-white/70">Label *</Label>
            <Input
              placeholder="Gift / Donation / Invoice / Payment"
              value={label}
              onChange={event => setLabel(event.target.value)}
              className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-blue-500/50"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-white/70">Amount zkLTC *</Label>
            <Input
              type="number"
              placeholder="0.005"
              value={amount}
              onChange={event => setAmount(event.target.value)}
              min="0.000000000000000001"
              step="0.001"
              className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-blue-500/50"
            />
            {amount && amountError && (
              <p className="text-xs text-red-400">{amountError}</p>
            )}
          </div>

          <p className="rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-xs text-white/45">
            This flow asks for two wallet confirmations: first to create the receipt, then to send the payment.
          </p>

          {statusText && (
            <p className={`rounded-lg px-3 py-2 text-sm ${isSuccess ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-300' : 'border border-blue-500/20 bg-blue-500/10 text-blue-200'}`}>
              {statusText}
            </p>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isConnected || !label.trim() || !amount.trim() || !!amountError || isBusy}
            className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, oklch(0.62 0.19 261), oklch(0.55 0.2 274))' }}
          >
            {isBusy ? 'Continue in wallet...' : `Send instantly to @${recipientUsername}`}
          </button>

          {receiptUrl && (
            <div className="space-y-3 rounded-xl border border-white/8 p-4" style={{ background: 'oklch(1 0 0 / 3%)' }}>
              <p className="text-sm font-semibold text-white">Payment receipt</p>
              <a
                href={receiptUrl}
                className="block break-all rounded-xl border border-white/8 bg-white/5 px-3 py-2 font-mono text-xs text-blue-300 transition-colors hover:text-blue-200"
              >
                {receiptUrl}
              </a>
              <div className="flex justify-end gap-2">
                <a
                  href={receiptUrl}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white"
                >
                  Open
                </a>
                <button
                  type="button"
                  onClick={copyReceiptLink}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white"
                >
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          )}

          <WalletRpcRecoveryNotice error={error} />

          {error && !isBandwidthLimitError(error) && (
            <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error.message}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
