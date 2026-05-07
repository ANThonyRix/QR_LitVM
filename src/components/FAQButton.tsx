'use client'
import { useState } from 'react'
import { CONTRACT_ADDRESS } from '@/lib/contract'

export function FAQButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Glowing FAQ button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 left-5 z-50 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white transition-all duration-300 hover:scale-105 active:scale-95"
        style={{
          background: 'linear-gradient(135deg, oklch(0.62 0.19 261 / 0.9), oklch(0.55 0.2 274 / 0.9))',
          boxShadow: '0 0 16px oklch(0.62 0.19 261 / 0.6), 0 0 32px oklch(0.62 0.19 261 / 0.3)',
          animation: 'faq-glow 2.5s ease-in-out infinite',
        }}
      >
        <span>?</span>
        <span>FAQ</span>
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'oklch(0 0 0 / 0.7)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          {/* Modal */}
          <div
            className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl"
            style={{
              background: 'oklch(0.11 0.03 264)',
              border: '1px solid oklch(1 0 0 / 10%)',
              boxShadow: '0 0 60px oklch(0.62 0.19 261 / 0.15)',
            }}
          >
            {/* Header */}
            <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-white/8"
              style={{ background: 'oklch(0.11 0.03 264)' }}>
              <div className="flex items-center gap-2">
                <span className="text-lg">❓</span>
                <h2 className="font-bold text-white text-lg">FAQ - QR LitVM</h2>
              </div>
              <button onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all">
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-5 space-y-6 text-sm leading-relaxed" style={{ color: 'oklch(0.78 0.02 250)' }}>

              <section>
                <p className="text-white/90">
                  <strong className="text-white">QR LitVM</strong> - DApp (decentralized application) for receiving crypto payments in{' '}
                  <strong className="text-blue-400">zkLTC</strong> (native token of the LitVM network).
                  Lets anyone create a payment link or QR code and receive payment directly to their wallet -
                  no intermediaries, no registration, no payment processor fees.
                </p>
                <p className="mt-3 text-white/70">
                  <strong className="text-white">LitVM</strong> - EVM-compatible ZK-rollup on Litecoin. Fast transactions
                  with low gas, secured by the Litecoin network.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-white mb-2">👥 Who is it for?</h3>
                <ul className="space-y-1.5">
                  {[
                    ['💼 Freelancers', 'Invoice clients with a link or QR code'],
                    ['🛍️ Online stores', 'Embed a "Pay" button on their site via iframe'],
                    ['🎙️ Streamers / creators', 'Share a donation link /u/username'],
                    ['🏪 Offline sellers', 'Print a QR code on paper or a screen'],
                  ].map(([who, what]) => (
                    <li key={who} className="flex gap-2">
                      <span className="shrink-0">{who}:</span>
                      <span className="text-white/60">{what}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <h3 className="font-bold text-white mb-3">📖 How to use?</h3>
                <div className="space-y-4">

                  <div>
                    <p className="font-semibold text-white/90 mb-1">1. Connect your wallet</p>
                    <p className="text-white/60 mb-2">Click "Connect Wallet" in the top right corner. You need MetaMask (or any EIP-6963 wallet).</p>
                    <div className="rounded-xl p-3 space-y-1 text-xs font-mono" style={{ background: 'oklch(1 0 0 / 4%)', border: '1px solid oklch(1 0 0 / 8%)' }}>
                      <p className="text-white/40 text-xs mb-1">Add the LitVM network:</p>
                      {[
                        ['Network', 'LitVM Liteforge Testnet'],
                        ['RPC URL', 'https://liteforge.rpc.caldera.xyz/http'],
                        ['Fallback RPC', 'https://liteforge.rpc.caldera.xyz/infra-partner-http'],
                        ['Chain ID', '4441'],
                        ['Currency', 'zkLTC'],
                        ['Explorer', 'liteforge.explorer.caldera.xyz'],
                      ].map(([k, v]) => (
                        <div key={k} className="flex gap-2">
                          <span className="text-white/40 w-20 shrink-0">{k}:</span>
                          <span className="text-blue-300 break-all">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="font-semibold text-white/90 mb-1">2. Create a payment link</p>
                    <ul className="space-y-0.5 text-white/60">
                      <li>• Enter what is being paid for: "Logo design", "T-shirt XL", "Donation"</li>
                      <li>• Enter the amount in zkLTC - or leave empty (payer will enter it)</li>
                      <li>• Click "Create link" and confirm in MetaMask</li>
                      <li>• Wait for blockchain confirmation (a few seconds)</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold text-white/90 mb-2">3. Three formats for receiving payment</p>
                    <div className="space-y-2">
                      {[
                        ['📱 QR Code', 'Styled QR with logo. Download as SVG (for print) or PNG (for messengers). Show the client - they scan and pay.'],
                        ['🔗 Link', 'Copy and send via Telegram, email, Discord. The client opens it, connects their wallet and pays with one click.'],
                        ['🖼️ Widget (iframe)', 'Embed code on your site - a "Pay zkLTC" button appears. Clients pay without leaving the page.'],
                      ].map(([title, desc]) => (
                        <div key={title} className="rounded-lg p-3" style={{ background: 'oklch(1 0 0 / 3%)', border: '1px solid oklch(1 0 0 / 6%)' }}>
                          <p className="text-white/80 font-medium text-xs mb-0.5">{title}</p>
                          <p className="text-white/50 text-xs">{desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="font-semibold text-white/90 mb-1">4. Short link /u/username</p>
                    <p className="text-white/60 mb-1">Register a username (3-32 chars, a-z 0-9 _) - one-time, on-chain. You will get a permanent link:</p>
                    <code className="text-blue-300 text-xs px-2 py-1 rounded" style={{ background: 'oklch(0.62 0.19 261 / 0.1)' }}>
                      https://qrlitvm.app/u/alice
                    </code>
                    <p className="mt-1.5 text-white/50 text-xs">Share it on social media, in your bio, on a business card.</p>
                  </div>

                  <div>
                    <p className="font-semibold text-white/90 mb-1">5. Payment page (for the payer)</p>
                    <p className="text-white/60">The payer sees the description, amount, status and pay button. After payment, status updates to "Paid" automatically.</p>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="font-bold text-white mb-3">⚡ Advantages</h3>
                <div className="grid gap-2 sm:grid-cols-3">
                  {[
                    ['Vs bank transfer', ['No 1-3 day wait', 'No bank fee (5-7%)', 'No personal data required', 'Works 24/7']],
                    ['Vs PayPal / Stripe', ['No verification required', 'No funds freeze', 'Funds go directly to wallet', 'Any country']],
                    ['Vs other crypto', ['On-chain requests', 'Real-time paid/pending status', 'Reentrancy protection', 'No backend']],
                  ].map(([title, items]) => (
                    <div key={title as string} className="rounded-xl p-3" style={{ background: 'oklch(0.62 0.19 261 / 0.07)', border: '1px solid oklch(0.62 0.19 261 / 0.15)' }}>
                      <p className="text-blue-300 font-semibold text-xs mb-2">{title as string}</p>
                      <ul className="space-y-0.5">
                        {(items as string[]).map(item => (
                          <li key={item} className="text-white/55 text-xs">✓ {item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="font-bold text-white mb-2">🔗 Key addresses</h3>
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid oklch(1 0 0 / 8%)' }}>
                  {[
                    ['Contract', CONTRACT_ADDRESS, `https://liteforge.explorer.caldera.xyz/address/${CONTRACT_ADDRESS}`],
                    ['Explorer', 'liteforge.explorer.caldera.xyz', 'https://liteforge.explorer.caldera.xyz'],
                    ['Faucet (zkLTC)', 'liteforge.hub.caldera.xyz', 'https://liteforge.hub.caldera.xyz'],
                  ].map(([label, value, href], i) => (
                    <div key={label} className={`flex gap-3 px-4 py-3 ${i > 0 ? 'border-t border-white/6' : ''}`}
                      style={{ background: i % 2 === 0 ? 'oklch(1 0 0 / 2%)' : 'transparent' }}>
                      <span className="text-white/40 text-xs w-24 shrink-0">{label}</span>
                      <a href={href} target="_blank" rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-xs font-mono break-all transition-colors">
                        {value}
                      </a>
                    </div>
                  ))}
                </div>
              </section>

            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes faq-glow {
          0%, 100% { box-shadow: 0 0 16px oklch(0.62 0.19 261 / 0.6), 0 0 32px oklch(0.62 0.19 261 / 0.3); }
          50%       { box-shadow: 0 0 24px oklch(0.62 0.19 261 / 0.9), 0 0 48px oklch(0.62 0.19 261 / 0.5), 0 0 64px oklch(0.55 0.2 274 / 0.3); }
        }
      `}</style>
    </>
  )
}
