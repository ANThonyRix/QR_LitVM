'use client'
import { use } from 'react'
import Image from 'next/image'
import { useAddressForUsername } from '@/hooks/useUsername'
import { WalletConnect } from '@/components/WalletConnect'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

const glassCard = {
  background: 'oklch(0.13 0.03 264 / 0.8)',
  border: '1px solid oklch(1 0 0 / 8%)',
  backdropFilter: 'blur(20px)',
  borderRadius: '16px',
} as React.CSSProperties

export default function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = use(params)
  const { address, isLoading } = useAddressForUsername(username)

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

  if (!address || address === ZERO_ADDRESS) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4" style={bg}>
        <div style={glassCard} className="max-w-sm w-full p-8 text-center">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-white/60">
            User <strong className="text-white">@{username}</strong> not found
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen relative overflow-hidden" style={bg}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, oklch(0.55 0.2 274), transparent 70%)' }} />
      </div>

      <div className="relative max-w-xl mx-auto px-4 py-8 space-y-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden ring-1 ring-white/10">
              <Image src="/logo.png" alt="LitVM" fill className="object-cover" priority />
            </div>
            <span className="font-bold text-white">QR LitVM</span>
          </div>
          <WalletConnect />
        </header>

        <div style={glassCard} className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold text-white"
              style={{ background: 'linear-gradient(135deg, oklch(0.62 0.19 261), oklch(0.55 0.2 274))' }}>
              {username[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">@{username}</h1>
              <p className="text-xs font-mono text-white/40">
                {address.slice(0, 10)}...{address.slice(-8)}
              </p>
            </div>
          </div>

          <div className="rounded-xl p-3 border border-white/8" style={{ background: 'oklch(1 0 0 / 3%)' }}>
            <p className="text-xs text-white/40 mb-1">Wallet address</p>
            <p className="font-mono text-xs text-white/70 break-all">{address}</p>
          </div>

          <a href="/"
            className="flex items-center justify-center w-full py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:scale-[1.02]"
            style={{ background: 'linear-gradient(135deg, oklch(0.62 0.19 261), oklch(0.55 0.2 274))' }}>
            ⚡ Create payment link
          </a>
        </div>
      </div>
    </main>
  )
}
