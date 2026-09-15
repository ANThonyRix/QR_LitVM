'use client'

import { use, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useAddressForUsername } from '@/hooks/useUsername'
import { WalletConnect } from '@/components/WalletConnect'
import { UsernameDirectPaymentModal } from '@/components/UsernameDirectPaymentModal'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export default function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = use(params)
  const { address, isLoading } = useAddressForUsername(username)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </main>
    )
  }

  if (!address || address === ZERO_ADDRESS) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm space-y-3 rounded-2xl border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            User <strong className="text-foreground">@{username}</strong> not found
          </p>
          <Link href="/" className="inline-block text-sm text-primary hover:underline">
            Back to Pay LitVM
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-xl space-y-6 px-4 py-8">
        <header className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="relative h-8 w-8 overflow-hidden rounded-lg border border-border">
              <Image src="/logo.png" alt="Pay LitVM" fill className="object-cover" priority />
            </div>
            <span className="font-bold text-foreground">Pay LitVM</span>
          </Link>
          <WalletConnect />
        </header>

        <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/30 bg-primary/15 text-2xl font-bold text-primary">
              {username[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">@{username}</h1>
              <p className="font-mono text-xs text-muted-foreground">
                {address.slice(0, 10)}...{address.slice(-8)}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-white/[0.03] p-3">
            <p className="mb-1 text-xs text-muted-foreground">Wallet address</p>
            <p className="break-all font-mono text-xs text-foreground/80">{address}</p>
          </div>

          <p className="text-sm text-muted-foreground">
            Send funds directly to this wallet from the username page.
          </p>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex w-full items-center justify-center rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
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
