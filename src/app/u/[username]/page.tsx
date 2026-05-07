'use client'

import { use, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useAddressForUsername } from '@/hooks/useUsername'
import { WalletConnect } from '@/components/WalletConnect'
import { UsernameDirectPaymentModal } from '@/components/UsernameDirectPaymentModal'

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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const bg = { background: 'oklch(0.09 0.025 264)' } as React.CSSProperties

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center" style={bg}>
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500/30 border-t-blue-500" />
          <p className="text-sm text-white/50">Loading...</p>
        </div>
      </main>
    )
  }

  if (!address || address === ZERO_ADDRESS) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4" style={bg}>
        <div style={glassCard} className="w-full max-w-sm p-8 text-center">
          <p className="text-white/60">
            User <strong className="text-white">@{username}</strong> not found
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="relative min-h-screen overflow-hidden" style={bg}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, oklch(0.55 0.2 274), transparent 70%)' }}
        />
      </div>

      <div className="relative mx-auto max-w-xl space-y-6 px-4 py-8">
        <header className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
            <div className="relative h-8 w-8 overflow-hidden rounded-lg ring-1 ring-white/10">
              <Image src="/logo.png" alt="LitVM" fill className="object-cover" priority />
            </div>
            <span className="font-bold text-white">QR LitVM</span>
          </Link>
          <WalletConnect />
        </header>

        <div style={glassCard} className="space-y-4 p-6">
          <div className="flex items-center gap-4">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-bold text-white"
              style={{ background: 'linear-gradient(135deg, oklch(0.62 0.19 261), oklch(0.55 0.2 274))' }}
            >
              {username[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">@{username}</h1>
              <p className="text-xs font-mono text-white/40">
                {address.slice(0, 10)}...{address.slice(-8)}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-white/8 p-3" style={{ background: 'oklch(1 0 0 / 3%)' }}>
            <p className="mb-1 text-xs text-white/40">Wallet address</p>
            <p className="break-all font-mono text-xs text-white/70">{address}</p>
          </div>

          <p className="text-sm text-white/55">
            Send funds directly to this wallet from the username page.
          </p>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex w-full items-center justify-center rounded-xl py-2.5 text-sm font-medium text-white transition-all hover:scale-[1.02]"
            style={{ background: 'linear-gradient(135deg, oklch(0.62 0.19 261), oklch(0.55 0.2 274))' }}
          >
            Send payment to @{username}
          </button>
        </div>
      </div>

      {isCreateModalOpen && (
        <UsernameDirectPaymentModal
          recipientAddress={address}
          recipientUsername={username}
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}
    </main>
  )
}
