import Image from 'next/image'
import { WalletConnect } from '@/components/WalletConnect'
import { PaymentGenerator } from '@/components/PaymentGenerator'
import { UsernameRegister } from '@/components/UsernameRegister'

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
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden ring-1 ring-white/10 shadow-lg">
              <Image src="/logo.png" alt="LitVM" fill className="object-cover" priority />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white leading-none">QR LitVM</h1>
              <p className="text-xs mt-0.5" style={{ color: 'oklch(0.58 0.03 250)' }}>Payment links in zkLTC</p>
            </div>
          </div>
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

        {/* Footer */}
        <footer className="text-center pb-4">
          <p className="text-xs" style={{ color: 'oklch(0.42 0.02 250)' }}>
            Powered by{' '}
            <a href="https://liteforge.explorer.caldera.xyz" target="_blank" rel="noopener noreferrer"
              className="hover:text-blue-400 transition-colors underline underline-offset-2">
              LitVM Liteforge Testnet
            </a>
            {' '}· zkLTC
          </p>
        </footer>
      </div>
    </main>
  )
}
