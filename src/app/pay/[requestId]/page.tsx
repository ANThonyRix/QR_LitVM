'use client'
import { use } from 'react'
import { usePaymentRequest } from '@/hooks/usePaymentRequest'
import { WalletConnect } from '@/components/WalletConnect'
import { PayButton } from '@/components/PayButton'
import { PaymentStatus } from '@/components/PaymentStatus'
import { QRDisplay } from '@/components/QRDisplay'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatEther } from 'viem'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export default function PayPage({
  params,
}: {
  params: Promise<{ requestId: string }>
}) {
  const { requestId } = use(params)
  const id = requestId as `0x${string}`
  const { request, isLoading } = usePaymentRequest(id)

  const pageUrl = typeof window !== 'undefined' ? window.location.href : ''

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-900">
        <p className="text-slate-400">Загрузка...</p>
      </main>
    )
  }

  if (!request?.recipient || request.recipient === ZERO_ADDRESS) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-900">
        <Card className="max-w-sm w-full mx-4">
          <CardContent className="pt-6 text-center text-muted-foreground">
            Платёжный запрос не найден
          </CardContent>
        </Card>
      </main>
    )
  }

  const amount = request.amount ?? 0n
  const amountDisplay = amount > 0n ? `${formatEther(amount)} zkLTC` : 'Любая сумма'

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="max-w-md mx-auto px-4 py-8 space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">QR LitVM</h1>
          <WalletConnect />
        </header>

        <Card>
          <CardHeader>
            <CardTitle>{request.label}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{amountDisplay}</span>
              <PaymentStatus paid={request.paid} payer={request.payer} />
            </div>
            <p className="text-xs text-muted-foreground font-mono break-all">
              Получатель: {request.recipient}
            </p>
            {!request.paid && (
              <PayButton requestId={id} fixedAmount={amount} paid={request.paid} />
            )}
          </CardContent>
        </Card>

        {pageUrl && (
          <div className="flex justify-center">
            <QRDisplay url={pageUrl} label={request.label} />
          </div>
        )}
      </div>
    </main>
  )
}
