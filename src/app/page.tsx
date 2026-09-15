import Image from 'next/image'
import Link from 'next/link'
import { WalletConnect } from '@/components/WalletConnect'
import { PaymentGenerator } from '@/components/PaymentGenerator'
import { UsernameRegister } from '@/components/UsernameRegister'
import { LinkHistory } from '@/components/LinkHistory'

const footerLinkClass =
  'inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-accent'

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-xl space-y-8 px-4 py-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-border">
              <Image src="/logo.png" alt="Pay LitVM" fill className="object-cover" priority unoptimized />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-none text-foreground">Pay LitVM</h1>
              <p className="mt-0.5 text-xs text-muted-foreground">Payment links in zkLTC & USDC</p>
            </div>
          </Link>
          <WalletConnect />
        </header>

        {/* Hero */}
        <div className="space-y-2 py-4 text-center">
          <h2 className="text-3xl font-bold text-foreground">
            Accept payments in zkLTC & USDC
          </h2>
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            Create a payment link and QR code - no intermediaries, directly on LitVM
          </p>
        </div>

        {/* Main content */}
        <PaymentGenerator />
        <UsernameRegister />
        <LinkHistory />

        {/* Footer */}
        <footer className="flex flex-col items-center gap-3 pb-4 pt-2">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <a href="https://liteforge.explorer.caldera.xyz" target="_blank" rel="noopener noreferrer" className={footerLinkClass}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              Explorer
            </a>
            <a href="https://docs.litvm.com" target="_blank" rel="noopener noreferrer" className={footerLinkClass}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
              Docs
            </a>
            <a href="https://liteforge.hub.caldera.xyz/" target="_blank" rel="noopener noreferrer" className={footerLinkClass}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v6l3-3"/><path d="M12 2v6l-3-3"/><path d="M5 12h14"/><rect x="3" y="10" width="18" height="12" rx="2"/></svg>
              Faucet
            </a>
            <a href="https://liteforge.hub.caldera.xyz" target="_blank" rel="noopener noreferrer" className={footerLinkClass}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/></svg>
              Bridge
            </a>
            <a href="https://x.com/Pay_LitVM" target="_blank" rel="noopener noreferrer" className={footerLinkClass}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
          </div>
          <p className="text-xs text-muted-foreground">
            ©2026 Pay LitVM · LitVM LiteForge Testnet
          </p>
        </footer>
      </div>
    </main>
  )
}
