'use client'

import { use } from 'react'
import { formatEther } from 'viem'
import { PayButton } from '@/components/PayButton'
import { WalletConnect } from '@/components/WalletConnect'
import { usePaymentRequest } from '@/hooks/usePaymentRequest'

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
  const amountDisplay = amount > 0n ? `${formatEther(amount)} zkLTC` : 'Any amount'
  const isClosed = !request.reusable && request.paid

  if (isClosed) {
    return (
      <div className="p-3 flex items-center gap-2 text-green-600 text-sm font-medium">
        <span>✓</span>
        <span>Paid {amountDisplay}</span>
      </div>
    )
  }

  return (
    <div className="space-y-2 p-3 font-sans">
      <p className="truncate text-xs text-gray-500">{request.label}</p>
      {request.reusable && (
        <p className="text-xs text-blue-600">
          Reusable link
          {request.paymentCount > 0n ? ` • ${request.paymentCount.toString()} payments received` : ''}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold">{amountDisplay}</span>
        <WalletConnect />
      </div>
      <PayButton
        requestId={id}
        fixedAmount={amount}
        isClosed={isClosed}
        reusable={request.reusable}
      />
    </div>
  )
}
