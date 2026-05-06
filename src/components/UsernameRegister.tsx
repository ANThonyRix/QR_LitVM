'use client'
import { useState, useEffect } from 'react'
import { useUsername } from '@/hooks/useUsername'
import { useAccount } from 'wagmi'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const glassCard = {
  background: 'oklch(0.13 0.03 264 / 0.8)',
  border: '1px solid oklch(1 0 0 / 8%)',
  backdropFilter: 'blur(20px)',
  borderRadius: '16px',
} as React.CSSProperties

export function UsernameRegister() {
  const [input, setInput] = useState('')
  const [changing, setChanging] = useState(false)
  const { isConnected } = useAccount()
  const { myUsername, register, change, isPending, isConfirming, isSuccess, error, refetch } = useUsername()

  useEffect(() => {
    if (isSuccess) {
      refetch()
      setChanging(false)
      setInput('')
    }
  }, [isSuccess])

  if (!isConnected) return null

  // Has username - show current + optional change form
  if (myUsername && !changing) {
    return (
      <div style={glassCard} className="p-4 space-y-2">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm text-white/50">Your short link:</span>
          <code className="text-sm font-mono px-3 py-1 rounded-lg text-blue-300"
            style={{ background: 'oklch(0.62 0.19 261 / 0.15)', border: '1px solid oklch(0.62 0.19 261 / 0.3)' }}>
            {typeof window !== 'undefined' ? window.location.origin : ''}/u/{myUsername}
          </code>
          <button
            onClick={() => { setChanging(true); setInput('') }}
            className="text-xs text-white/40 hover:text-white/70 transition-colors ml-auto underline underline-offset-2"
          >
            Change
          </button>
        </div>
      </div>
    )
  }

  const isChange = !!myUsername && changing
  const handleSubmit = () => isChange ? change(input) : register(input)

  return (
    <div style={glassCard} className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
          style={{ background: 'oklch(0.55 0.2 274 / 0.2)', border: '1px solid oklch(0.55 0.2 274 / 0.3)' }}>
          @
        </div>
        <h2 className="font-semibold text-white text-sm">
          {isChange ? `Change @${myUsername}` : 'Short link'}
        </h2>
        {isChange && (
          <button onClick={() => setChanging(false)} className="text-xs text-white/40 hover:text-white/60 ml-auto">
            Cancel
          </button>
        )}
        {!isChange && <span className="text-xs text-white/40 ml-auto">optional</span>}
      </div>

      <div className="space-y-1.5">
        <Label className="text-white/70 text-xs uppercase tracking-wide">
          {isChange ? 'New username (3-32 chars, a-z 0-9 _)' : 'Username (3-32 chars, a-z 0-9 _)'}
        </Label>
        <Input
          placeholder={isChange ? myUsername : 'alice'}
          value={input}
          onChange={e => setInput(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
          maxLength={32}
          className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-purple-500/50"
        />
      </div>

      {isChange && (
        <p className="text-xs text-amber-400/70 bg-amber-500/10 rounded-lg px-3 py-2 border border-amber-500/20">
          Old URL /u/{myUsername} will stop working
        </p>
      )}

      <button
        className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
        style={{ background: 'linear-gradient(135deg, oklch(0.55 0.2 274), oklch(0.5 0.18 280))' }}
        onClick={handleSubmit}
        disabled={input.length < 3 || isPending || isConfirming}
      >
        {isPending ? '⏳ Confirm...' :
         isConfirming ? '⛓️ Waiting...' :
         isChange ? '🔄 Change username' : '🔖 Register username'}
      </button>

      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2 border border-red-500/20">
          {(error as Error).message}
        </p>
      )}
    </div>
  )
}
