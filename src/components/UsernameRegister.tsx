'use client'

import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { useUsername } from '@/hooks/useUsername'
import { isBandwidthLimitError } from '@/lib/litvmNetwork'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { WalletRpcRecoveryNotice } from './WalletRpcRecoveryNotice'

const glassCard = {
  background: 'oklch(0.13 0.03 264 / 0.8)',
  border: '1px solid oklch(1 0 0 / 8%)',
  backdropFilter: 'blur(20px)',
  borderRadius: '16px',
} as React.CSSProperties

export function UsernameRegister() {
  const [input, setInput] = useState('')
  const [changing, setChanging] = useState(false)
  const [copied, setCopied] = useState(false)
  const { isConnected } = useAccount()
  const {
    myUsername,
    register,
    change,
    isPending,
    isPreparingWallet,
    isConfirming,
    isSuccess,
    error,
    refetch,
  } = useUsername()

  useEffect(() => {
    if (isSuccess) {
      refetch()
      setChanging(false)
      setInput('')
    }
  }, [isSuccess, refetch])

  const shortLink =
    typeof window !== 'undefined' && myUsername
      ? `${window.location.origin}/u/${myUsername}`
      : ''

  const copyShortLink = async () => {
    if (!shortLink) {
      return
    }

    await navigator.clipboard.writeText(shortLink)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  if (!isConnected) {
    return null
  }

  if (myUsername && !changing) {
    return (
      <div style={glassCard} className="space-y-2 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-white/50">Your short link:</span>
          <button
            type="button"
            onClick={copyShortLink}
            className="rounded-lg px-3 py-1 font-mono text-sm text-blue-300 transition-all hover:text-blue-200 active:scale-[0.98]"
            style={{
              background: 'oklch(0.62 0.19 261 / 0.15)',
              border: '1px solid oklch(0.62 0.19 261 / 0.3)',
            }}
            title="Tap or click to copy"
          >
            {shortLink}
          </button>
          {copied && <span className="text-xs text-emerald-300">Copied</span>}
          <button
            type="button"
            onClick={() => {
              setChanging(true)
              setInput('')
            }}
            className="ml-auto text-xs text-white/40 underline underline-offset-2 transition-colors hover:text-white/70"
          >
            Change
          </button>
        </div>
      </div>
    )
  }

  const isChange = Boolean(myUsername) && changing

  const handleSubmit = () => {
    void (isChange ? change(input) : register(input))
  }

  return (
    <div style={glassCard} className="space-y-4 p-6">
      <div className="flex items-center gap-2">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-lg text-sm"
          style={{
            background: 'oklch(0.55 0.2 274 / 0.2)',
            border: '1px solid oklch(0.55 0.2 274 / 0.3)',
          }}
        >
          @
        </div>
        <h2 className="text-sm font-semibold text-white">
          {isChange ? `Change @${myUsername}` : 'Short link'}
        </h2>
        {isChange && (
          <button
            type="button"
            onClick={() => setChanging(false)}
            className="ml-auto text-xs text-white/40 hover:text-white/60"
          >
            Cancel
          </button>
        )}
        {!isChange && <span className="ml-auto text-xs text-white/40">optional</span>}
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs uppercase tracking-wide text-white/70">
          {isChange ? 'New username (3-32 chars, a-z 0-9 _)' : 'Username (3-32 chars, a-z 0-9 _)'}
        </Label>
        <Input
          placeholder={isChange ? myUsername : 'alice'}
          value={input}
          onChange={event => setInput(event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
          maxLength={32}
          className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-purple-500/50"
        />
      </div>

      {isChange && (
        <p className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-400/70">
          Old URL /u/{myUsername} will stop working
        </p>
      )}

      <button
        type="button"
        className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        style={{ background: 'linear-gradient(135deg, oklch(0.55 0.2 274), oklch(0.5 0.18 280))' }}
        onClick={handleSubmit}
        disabled={input.length < 3 || isPending || isPreparingWallet || isConfirming}
      >
        {isPreparingWallet
          ? 'Checking wallet network...'
          : isPending
            ? 'Confirm in wallet...'
            : isConfirming
              ? 'Waiting for blockchain...'
              : isChange
                ? 'Change username'
                : 'Register username'}
      </button>

      <WalletRpcRecoveryNotice error={error} />

      {error && !isBandwidthLimitError(error) && (
        <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {(error as Error).message}
        </p>
      )}
    </div>
  )
}
