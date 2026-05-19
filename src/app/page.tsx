import Image from 'next/image'
import Link from 'next/link'
import { WalletConnect } from '@/components/WalletConnect'
import { PaymentGenerator } from '@/components/PaymentGenerator'
import { UsernameRegister } from '@/components/UsernameRegister'
import { LinkHistory } from '@/components/LinkHistory'

export default function Home() {
  return (
    <main className="min-h-screen relative overflow-hidden" style={{ background: 'oklch(0.09 0.025 264)' }}>
      {/* Ambient glow blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, oklch(0.62 0.19 261), transparent 70%)' }} />
        <div className="absolute -bottom-40 -right-20 w-96 h-96 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, oklch(0.55 0.2 274), transparent 70%)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, oklch(0.62 0.19 261), transparent 60%)' }} />
      </div>

      <div className="relative max-w-xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-90">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden ring-1 ring-white/10 shadow-lg">
              <Image src="/logo.png" alt="LitVM" fill className="object-cover" priority unoptimized />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white leading-none">Pay LitVM</h1>
              <p className="text-xs mt-0.5" style={{ color: 'oklch(0.58 0.03 250)' }}>Payment links in zkLTC</p>
            </div>
          </Link>
          <WalletConnect />
        </header>

        {/* Hero */}
        <div className="text-center space-y-2 py-4">
          <h2 className="text-3xl font-bold"
            style={{ background: 'linear-gradient(135deg, #fff 30%, oklch(0.7 0.15 261))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Accept payments in zkLTC
          </h2>
          <p className="text-sm max-w-sm mx-auto" style={{ color: 'oklch(0.58 0.03 250)' }}>
            Create a payment link and QR code - no intermediaries, directly on LitVM
          </p>
        </div>

        {/* Main content */}
        <PaymentGenerator />
        <UsernameRegister />
        <LinkHistory />

        {/* Footer */}
        <footer className="flex flex-col items-center gap-3 pb-4 pt-2">
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <a href="https://liteforge.explorer.caldera.xyz" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
              style={{ background: 'oklch(0.18 0.02 260)', color: 'oklch(0.7 0.1 261)', border: '1px solid oklch(0.25 0.03 260)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              Explorer
            </a>
            <a href="https://docs.litvm.com" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
              style={{ background: 'oklch(0.18 0.02 260)', color: 'oklch(0.7 0.1 261)', border: '1px solid oklch(0.25 0.03 260)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
              Docs
            </a>
            <a href="https://liteforge.hub.caldera.xyz/" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
              style={{ background: 'oklch(0.18 0.02 260)', color: 'oklch(0.7 0.1 261)', border: '1px solid oklch(0.25 0.03 260)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v6l3-3"/><path d="M12 2v6l-3-3"/><path d="M5 12h14"/><rect x="3" y="10" width="18" height="12" rx="2"/></svg>
              Faucet
            </a>
            <a href="https://liteforge.hub.caldera.xyz" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
              style={{ background: 'oklch(0.18 0.02 260)', color: 'oklch(0.7 0.1 261)', border: '1px solid oklch(0.25 0.03 260)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/></svg>
              Bridge
            </a>
            <a href="https://x.com/Pay_LitVM" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
              style={{ background: 'oklch(0.18 0.02 260)', color: 'oklch(0.7 0.1 261)', border: '1px solid oklch(0.25 0.03 260)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
          </div>
          <p className="text-xs" style={{ color: 'oklch(0.58 0.03 250)' }}>
            ©2026 Pay LitVM · LitVM LiteForge Testnet
          </p>
        </footer>
      </div>
    </main>
  )
}
