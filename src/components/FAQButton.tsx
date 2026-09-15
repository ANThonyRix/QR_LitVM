'use client'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import {
  HelpCircle,
  X,
  Coins,
  Users,
  BookOpen,
  Zap,
  Link2,
  Briefcase,
  Store,
  Mic,
  ShoppingBag,
  QrCode,
  AppWindow,
  Check,
} from 'lucide-react'
import { CONTRACT_ADDRESS } from '@/lib/contract'
import { USDC_ADDRESS } from '@/lib/tokens'

export function FAQButton() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  if (pathname?.startsWith('/widget/')) {
    return null
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open FAQ"
        className="fixed bottom-5 left-5 z-50 flex items-center gap-2 rounded-full border border-border bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <HelpCircle size={16} />
        <span>FAQ</span>
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          {/* Modal */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="FAQ"
            className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card"
          >
            {/* Header */}
            <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-6 py-4">
              <div className="flex items-center gap-2">
                <HelpCircle size={18} className="text-primary" />
                <h2 className="text-lg font-bold text-foreground">FAQ - Pay LitVM</h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close FAQ"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-6 px-6 py-5 text-sm leading-relaxed text-white/75">

              <section>
                <p className="text-white/90">
                  <strong className="text-white">Pay LitVM</strong> - DApp (decentralized application) for receiving crypto payments in{' '}
                  <strong className="text-blue-400">zkLTC</strong> (native token of the LitVM network) and{' '}
                  <strong className="text-green-400">USDC</strong> (ERC-20 stablecoin).
                  Lets anyone create a payment link or QR code and receive payment directly to their wallet -
                  no intermediaries, no registration, no payment processor fees.
                </p>
                <p className="mt-3 text-white/70">
                  <strong className="text-white">LitVM</strong> - EVM-compatible ZK-rollup on Litecoin. Fast transactions
                  with low gas, secured by the Litecoin network.
                </p>
              </section>

              <section>
                <h3 className="mb-2 flex items-center gap-2 font-bold text-white">
                  <Coins size={16} className="text-primary" /> Supported tokens
                </h3>
                <div className="space-y-2">
                  <div className="rounded-lg border border-white/6 bg-white/[0.03] p-3">
                    <p className="text-white/80 font-medium text-xs mb-0.5">zkLTC (native)</p>
                    <p className="text-white/50 text-xs">Native token of the LitVM network. Used for gas fees and payments. Flexible amount - payer can choose how much to send.</p>
                  </div>
                  <div className="rounded-lg border border-white/6 bg-white/[0.03] p-3">
                    <p className="text-white/80 font-medium text-xs mb-0.5">USDC (ERC-20 stablecoin)</p>
                    <p className="text-white/50 text-xs">USD-pegged stablecoin on LitVM. Supports both fixed and flexible amounts. Payer approves the token transfer, then the contract moves funds to the recipient.</p>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="mb-2 flex items-center gap-2 font-bold text-white">
                  <Users size={16} className="text-primary" /> Who is it for?
                </h3>
                <ul className="space-y-2">
                  {[
                    [Briefcase, 'Freelancers', 'Invoice clients with a link or QR code'],
                    [Store, 'Online stores', 'Embed a "Pay" button on their site via iframe'],
                    [Mic, 'Streamers / creators', 'Share a donation link /u/username'],
                    [ShoppingBag, 'Offline sellers', 'Print a QR code on paper or a screen'],
                  ].map(([Icon, who, what]) => {
                    const PersonaIcon = Icon as typeof Briefcase
                    return (
                      <li key={who as string} className="flex items-start gap-2">
                        <PersonaIcon size={14} className="mt-0.5 shrink-0 text-white/40" />
                        <span>
                          <span className="text-white/85">{who as string}:</span>{' '}
                          <span className="text-white/60">{what as string}</span>
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </section>

              <section>
                <h3 className="mb-3 flex items-center gap-2 font-bold text-white">
                  <BookOpen size={16} className="text-primary" /> How to use?
                </h3>
                <div className="space-y-4">

                  <div>
                    <p className="font-semibold text-white/90 mb-1">1. Connect your wallet</p>
                    <p className="text-white/60 mb-2">Click "Connect Wallet" in the top right corner. You need MetaMask (or any EIP-6963 wallet).</p>
                    <div className="rounded-xl border border-white/8 bg-white/[0.04] p-3 space-y-1 text-xs font-mono">
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
                      <li>• Select the token: zkLTC or USDC</li>
                      <li>• Enter what is being paid for: "Logo design", "T-shirt XL", "Donation"</li>
                      <li>• Enter the amount (required for USDC, optional for zkLTC)</li>
                      <li>• Click "Create link" and confirm in MetaMask</li>
                      <li>• Wait for blockchain confirmation (a few seconds)</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold text-white/90 mb-2">3. Three formats for receiving payment</p>
                    <div className="space-y-2">
                      {[
                        [QrCode, 'QR Code', 'Styled QR with logo. Download as SVG (for print) or PNG (for messengers). Show the client - they scan and pay.'],
                        [Link2, 'Link', 'Copy and send via Telegram, email, Discord. The client opens it, connects their wallet and pays with one click.'],
                        [AppWindow, 'Widget (iframe)', 'Embed code on your site - a "Pay" button appears. Clients pay without leaving the page.'],
                      ].map(([Icon, title, desc]) => {
                        const FormatIcon = Icon as typeof QrCode
                        return (
                          <div key={title as string} className="rounded-lg border border-white/6 bg-white/[0.03] p-3">
                            <p className="mb-0.5 flex items-center gap-1.5 text-xs font-medium text-white/80">
                              <FormatIcon size={14} className="text-primary" /> {title as string}
                            </p>
                            <p className="text-white/50 text-xs">{desc as string}</p>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="font-semibold text-white/90 mb-1">4. Paying with USDC</p>
                    <ul className="space-y-0.5 text-white/60">
                      <li>• The payer needs USDC tokens in their wallet on LitVM</li>
                      <li>• If the amount is flexible, the payer enters the desired amount</li>
                      <li>• First transaction: approve the contract to spend USDC</li>
                      <li>• Second transaction: the contract transfers USDC to the recipient</li>
                      <li>• Both steps are handled automatically with two wallet confirmations</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold text-white/90 mb-1">5. Short link /u/username</p>
                    <p className="text-white/60 mb-1">Register a username (3-32 chars, a-z 0-9 _) - one-time, on-chain. You will get a permanent link:</p>
                    <code className="rounded bg-primary/10 px-2 py-1 text-xs text-blue-300">
                      https://qrlitvm.app/u/alice
                    </code>
                    <p className="mt-1.5 text-white/50 text-xs">Share it on social media, in your bio, on a business card.</p>
                  </div>

                  <div>
                    <p className="font-semibold text-white/90 mb-1">6. Payment page (for the payer)</p>
                    <p className="text-white/60">The payer sees the description, amount, token type, status and pay button. After payment, status updates to "Paid" automatically.</p>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="mb-3 flex items-center gap-2 font-bold text-white">
                  <Zap size={16} className="text-primary" /> Advantages
                </h3>
                <div className="grid gap-2 sm:grid-cols-3">
                  {[
                    ['Vs bank transfer', ['No 1-3 day wait', 'No bank fee (5-7%)', 'No personal data required', 'Works 24/7']],
                    ['Vs PayPal / Stripe', ['No verification required', 'No funds freeze', 'Funds go directly to wallet', 'Any country']],
                    ['Vs other crypto', ['On-chain requests', 'Multi-token (zkLTC + USDC)', 'Reentrancy protection', 'No backend']],
                  ].map(([title, items]) => (
                    <div key={title as string} className="rounded-xl border border-primary/15 bg-primary/[0.07] p-3">
                      <p className="text-blue-300 font-semibold text-xs mb-2">{title as string}</p>
                      <ul className="space-y-1">
                        {(items as string[]).map(item => (
                          <li key={item} className="flex items-start gap-1.5 text-white/55 text-xs">
                            <Check size={12} className="mt-0.5 shrink-0 text-primary" /> {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="mb-2 flex items-center gap-2 font-bold text-white">
                  <Link2 size={16} className="text-primary" /> Key addresses
                </h3>
                <div className="overflow-hidden rounded-xl border border-white/8">
                  {[
                    ['Contract', CONTRACT_ADDRESS, `https://liteforge.explorer.caldera.xyz/address/${CONTRACT_ADDRESS}`],
                    ['USDC Token', USDC_ADDRESS, `https://liteforge.explorer.caldera.xyz/address/${USDC_ADDRESS}`],
                    ['Explorer', 'liteforge.explorer.caldera.xyz', 'https://liteforge.explorer.caldera.xyz'],
                    ['Faucet (zkLTC)', 'liteforge.hub.caldera.xyz', 'https://liteforge.hub.caldera.xyz'],
                  ].map(([label, value, href], i) => (
                    <div key={label} className={`flex gap-3 px-4 py-3 ${i > 0 ? 'border-t border-white/6' : ''} ${i % 2 === 0 ? 'bg-white/[0.02]' : ''}`}>
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
    </>
  )
}
