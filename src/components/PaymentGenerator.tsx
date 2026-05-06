'use client'
import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useCreateRequest } from '@/hooks/useCreateRequest'
import { QRDisplay } from './QRDisplay'
import { EmbedCode } from './EmbedCode'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const glassCard = {
  background: 'oklch(0.13 0.03 264 / 0.8)',
  border: '1px solid oklch(1 0 0 / 8%)',
  backdropFilter: 'blur(20px)',
  borderRadius: '16px',
} as React.CSSProperties

export function PaymentGenerator() {
  const { isConnected } = useAccount()
  const [amount, setAmount] = useState('')
  const [label, setLabel] = useState('')
  const [payUrl, setPayUrl] = useState('')
  const [copied, setCopied] = useState(false)

  const { create, isPending, isConfirming, requestId, error } = useCreateRequest()

  useEffect(() => {
    if (requestId) {
      const url = `${window.location.origin}/pay/${requestId}`
      setPayUrl(url)
      const history = JSON.parse(localStorage.getItem('qrlitvm_history') ?? '[]')
      history.unshift({ id: requestId, url, label, amount, createdAt: Date.now() })
      localStorage.setItem('qrlitvm_history', JSON.stringify(history.slice(0, 50)))
    }
  }, [requestId])

  const handleCreate = () => {
    if (!label.trim()) return
    create(amount, label)
  }

  const copyLink = async () => {
    await navigator.clipboard.writeText(payUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!isConnected) {
    return (
      <div style={glassCard} className="p-6 text-center">
        <div className="text-4xl mb-3">🔗</div>
        <p className="text-white/60 text-sm">Connect your wallet to create a payment link</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div style={glassCard} className="p-6 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
            style={{ background: 'oklch(0.62 0.19 261 / 0.2)', border: '1px solid oklch(0.62 0.19 261 / 0.3)' }}>
            ⚡
          </div>
          <h2 className="font-semibold text-white">Create payment link</h2>
        </div>

        <div className="space-y-1.5">
          <Label className="text-white/70 text-xs uppercase tracking-wide">Description *</Label>
          <Input
            placeholder="Freelance project / Product"
            value={label}
            onChange={e => setLabel(e.target.value)}
            className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-blue-500/50"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-white/70 text-xs uppercase tracking-wide">Amount zkLTC</Label>
          <Input
            type="number"
            placeholder="0.5  (leave empty - any amount)"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            min="0"
            step="0.001"
            className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-blue-500/50"
          />
        </div>

        <button
          className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg, oklch(0.62 0.19 261), oklch(0.55 0.2 274))' }}
          onClick={handleCreate}
          disabled={!label.trim() || isPending || isConfirming}
        >
          {isPending ? '⏳ Confirm in wallet...' :
           isConfirming ? '⛓️ Waiting for blockchain...' :
           '✨ Create link'}
        </button>

        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2 border border-red-500/20">
            {(error as Error).message}
          </p>
        )}
      </div>

      {payUrl && (
        <div style={glassCard} className="p-5">
          <Tabs defaultValue="qr">
            <TabsList className="w-full bg-white/5 border border-white/10">
              <TabsTrigger value="qr" className="flex-1 data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60">
                📱 QR Code
              </TabsTrigger>
              <TabsTrigger value="link" className="flex-1 data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60">
                🔗 Link
              </TabsTrigger>
              <TabsTrigger value="embed" className="flex-1 data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60">
                🖼️ Widget
              </TabsTrigger>
            </TabsList>
            <TabsContent value="qr" className="flex justify-center py-5">
              <QRDisplay url={payUrl} label={label} />
            </TabsContent>
            <TabsContent value="link" className="space-y-3 pt-4">
              <div className="bg-white/5 rounded-xl p-3 break-all text-sm font-mono text-white/80 border border-white/10">
                {payUrl}
              </div>
              <button
                className="w-full py-2.5 rounded-xl text-sm font-medium text-white/80 border border-white/15 bg-white/5 hover:bg-white/10 transition-all"
                onClick={copyLink}
              >
                {copied ? '✅ Copied!' : '📋 Copy link'}
              </button>
            </TabsContent>
            <TabsContent value="embed" className="pt-4">
              {requestId && <EmbedCode requestId={requestId} />}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}
