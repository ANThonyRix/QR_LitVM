import { WalletConnect } from '@/components/WalletConnect'
import { PaymentGenerator } from '@/components/PaymentGenerator'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">QR LitVM</h1>
            <p className="text-slate-400 text-sm">Платёжные ссылки в zkLTC</p>
          </div>
          <WalletConnect />
        </header>
        <PaymentGenerator />
      </div>
    </main>
  )
}
