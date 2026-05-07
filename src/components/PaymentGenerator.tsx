'use client'

import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { CONTRACT_VERSION } from '@/lib/contract'
import { useCreateRequest } from '@/hooks/useCreateRequest'
import { ONCHAIN_HISTORY_REFRESH_EVENT } from '@/hooks/useOnchainHistory'
import { isBandwidthLimitError } from '@/lib/litvmNetwork'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { WalletRpcRecoveryNotice } from './WalletRpcRecoveryNotice'
import { EmbedCode } from './EmbedCode'
import { QRDisplay } from './QRDisplay'

type LinkMode = 'one-time' | 'reusable'

const glassCard = {
  background: 'oklch(0.13 0.03 264 / 0.8)',
  border: '1px solid oklch(1 0 0 / 8%)',
  backdropFilter: 'blur(20px)',
  borderRadius: '16px',
} as React.CSSProperties

export function PaymentGenerator() {
  const { isConnected } = useAccount()
  const supportsReusableLinks = CONTRACT_VERSION === 'v3'

  const [amount, setAmount] = useState('')
  const [label, setLabel] = useState('')
  const [payUrl, setPayUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [linkMode, setLinkMode] = useState<LinkMode>('one-time')

  const { create, isPending, isPreparingWallet, isConfirming, requestId, error } = useCreateRequest()

  useEffect(() => {
    if (!requestId) {
      return
    }

    const url = `${window.location.origin}/pay/${requestId}`
    setPayUrl(url)
    window.dispatchEvent(new Event(ONCHAIN_HISTORY_REFRESH_EVENT))
  }, [requestId])

  const handleCreate = () => {
    if (!label.trim()) {
      return
    }

    create(amount, label, linkMode === 'reusable')
  }

  const copyLink = async () => {
    await navigator.clipboard.writeText(payUrl)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  const resetGenerator = () => {
    setAmount('')
    setLabel('')
    setPayUrl('')
    setCopied(false)
    setLinkMode('one-time')
  }

  if (!isConnected) {
    return (
      <div style={glassCard} className="p-6 text-center">
        <div className="mb-3 text-4xl">🔗</div>
        <p className="text-sm text-white/60">Connect your wallet to create a payment link</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div style={glassCard} className="space-y-5 p-6">
        <div className="mb-1 flex items-center gap-2">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg text-sm"
            style={{
              background: 'oklch(0.62 0.19 261 / 0.2)',
              border: '1px solid oklch(0.62 0.19 261 / 0.3)',
            }}
          >
            ⚡
          </div>
          <h2 className="font-semibold text-white">Create payment link</h2>
        </div>

        {supportsReusableLinks && (
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-white/70">Link type</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLinkMode('one-time')}
                className={`rounded-xl border px-4 py-3 text-left transition-all ${
                  linkMode === 'one-time'
                    ? 'border-blue-400/40 bg-blue-500/15 text-white'
                    : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/8'
                }`}
              >
                <p className="text-sm font-semibold">One-time</p>
                <p className="mt-1 text-xs text-white/50">Closes after the first successful payment.</p>
              </button>
              <button
                type="button"
                onClick={() => setLinkMode('reusable')}
                className={`rounded-xl border px-4 py-3 text-left transition-all ${
                  linkMode === 'reusable'
                    ? 'border-blue-400/40 bg-blue-500/15 text-white'
                    : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/8'
                }`}
              >
                <p className="text-sm font-semibold">Reusable</p>
                <p className="mt-1 text-xs text-white/50">Stays active for donations, stores, and repeated payments.</p>
              </button>
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wide text-white/70">Description *</Label>
          <Input
            placeholder="Donation / Product / Service"
            value={label}
            onChange={event => setLabel(event.target.value)}
            className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-blue-500/50"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wide text-white/70">Amount zkLTC</Label>
          <Input
            type="number"
            placeholder="0.5 (leave empty for any amount)"
            value={amount}
            onChange={event => setAmount(event.target.value)}
            min="0"
            step="0.001"
            className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-blue-500/50"
          />
          <p className="text-xs text-white/40">
            {linkMode === 'reusable'
              ? 'Reusable links can be used for open donations or repeated fixed-price payments.'
              : 'Leave the amount empty to let the payer choose the payment value.'}
          </p>
        </div>

        <button
          type="button"
          className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, oklch(0.62 0.19 261), oklch(0.55 0.2 274))' }}
          onClick={handleCreate}
          disabled={!label.trim() || isPending || isPreparingWallet || isConfirming}
        >
          {isPreparingWallet
            ? 'Checking wallet network...'
            : isPending
            ? 'Confirm in wallet...'
            : isConfirming
              ? 'Waiting for blockchain...'
              : linkMode === 'reusable'
                ? 'Create reusable link'
                : 'Create link'}
        </button>

        <WalletRpcRecoveryNotice error={error} />

        {error && !isBandwidthLimitError(error) && (
          <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {(error as Error).message}
          </p>
        )}
      </div>

      {payUrl && (
        <div style={glassCard} className="p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">
                {linkMode === 'reusable' ? 'Reusable payment link ready' : 'Payment link ready'}
              </p>
              <p className="mt-1 text-xs text-white/45">
                {linkMode === 'reusable'
                  ? 'Use the same URL for repeated payments, donations, or embedded store widgets.'
                  : 'Use this link for a single payment request.'}
              </p>
            </div>
          </div>

          <Tabs defaultValue="qr">
            <TabsList className="w-full border border-white/10 bg-white/5">
              <TabsTrigger value="qr" className="flex-1 text-white/60 data-[state=active]:bg-white/10 data-[state=active]:text-white">
                QR Code
              </TabsTrigger>
              <TabsTrigger value="link" className="flex-1 text-white/60 data-[state=active]:bg-white/10 data-[state=active]:text-white">
                Link
              </TabsTrigger>
              <TabsTrigger value="embed" className="flex-1 text-white/60 data-[state=active]:bg-white/10 data-[state=active]:text-white">
                Widget
              </TabsTrigger>
            </TabsList>

            <TabsContent value="qr" className="flex justify-center py-5">
              <QRDisplay url={payUrl} label={label} />
            </TabsContent>

            <TabsContent value="link" className="space-y-3 pt-4">
              <div className="break-all rounded-xl border border-white/10 bg-white/5 p-3 font-mono text-sm text-white/80">
                {payUrl}
              </div>
              <button
                type="button"
                className="w-full rounded-xl border border-white/15 bg-white/5 py-2.5 text-sm font-medium text-white/80 transition-all hover:bg-white/10"
                onClick={copyLink}
              >
                {copied ? 'Copied!' : 'Copy link'}
              </button>
            </TabsContent>

            <TabsContent value="embed" className="pt-4">
              {requestId && <EmbedCode requestId={requestId} />}
            </TabsContent>
          </Tabs>

          <button
            type="button"
            className="mt-4 w-full rounded-xl border border-white/15 bg-white/5 py-2.5 text-sm font-medium text-white/80 transition-all hover:bg-white/10"
            onClick={resetGenerator}
          >
            Create new link
          </button>
        </div>
      )}
    </div>
  )
}
