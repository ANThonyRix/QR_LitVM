'use client'
import { use } from 'react'
import { usePaymentRequest } from '@/hooks/usePaymentRequest'
import { PayButton } from '@/components/PayButton'
import { WalletConnect } from '@/components/WalletConnect'
import { formatEther } from 'viem'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export default function WidgetPage({
  params,
}: {
  params: Promise<{ requestId: string }>
}) {
  const { requestId } = use(params)
  const id = requestId as `0x${string}`
  const { request, isLoading } = usePaymentRequest(id)

  if (isLoading) {
    return <div className="p-3 text-sm text-gray-500">Loading...</div>
  }

  if (!request?.recipient || request.recipient === ZERO_ADDRESS) {
    return <div className="p-3 text-sm text-red-500">Request not found</div>
  }

  const amount = request.amount ?? 0n
  const amountDisplay = amount > 0n ? `${formatEther(amount)} zkLTC` : 'zkLTC'

  if (request.paid) {
    return (
      <div className="p-3 flex items-center gap-2 text-green-600 text-sm font-medium">
        <span>✓</span>
        <span>Paid {amountDisplay}</span>
      </div>
    )
  }

  return (
    <div className="p-3 space-y-2 font-sans">
      <p className="text-xs text-gray-500 truncate">{request.label}</p>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-semibold text-sm">{amountDisplay}</span>
        <WalletConnect />
      </div>
      <PayButton requestId={id} fixedAmount={amount} paid={request.paid} />
    </div>
  )
}
