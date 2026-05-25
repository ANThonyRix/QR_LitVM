'use client'
import { Badge } from '@/components/ui/badge'
import { formatEther, formatUnits } from 'viem'
import { getTokenByAddress, isNativeToken } from '@/lib/tokens'

interface Props {
  paid: boolean
  payer?: string
  reusable: boolean
  paymentCount: bigint
  totalPaid: bigint
  tokenAddress?: `0x${string}` | null
}

export function PaymentStatus({ paid, payer, reusable, paymentCount, totalPaid, tokenAddress }: Props) {
  const token = getTokenByAddress(tokenAddress ?? null)
  const isNative = isNativeToken(tokenAddress)

  const formatAmount = (amount: bigint) =>
    isNative ? formatEther(amount) : formatUnits(amount, token.decimals)

  if (reusable) {
    return (
      <div className="space-y-1 text-right">
        <Badge className="bg-blue-500 text-white">Reusable</Badge>
        <p className="text-xs text-muted-foreground">
          {paymentCount > 0n
            ? `${paymentCount.toString()} payments received`
            : 'Ready to receive payments'}
        </p>
        {paymentCount > 0n && (
          <p className="text-xs text-muted-foreground">
            Total collected: {formatAmount(totalPaid)} {token.symbol}
          </p>
        )}
        {payer && payer !== '0x0000000000000000000000000000000000000000' && paymentCount > 0n && (
          <p className="text-xs text-muted-foreground font-mono">
            last payer {payer.slice(0, 6)}...{payer.slice(-4)}
          </p>
        )}
      </div>
    )
  }

  return paid ? (
    <div className="space-y-1">
      <Badge className="bg-green-500 text-white">Paid</Badge>
      {payer && payer !== '0x0000000000000000000000000000000000000000' && (
        <p className="text-xs text-muted-foreground font-mono">
          from {payer.slice(0, 6)}...{payer.slice(-4)}
        </p>
      )}
    </div>
  ) : (
    <Badge variant="outline">Awaiting payment</Badge>
  )
}
