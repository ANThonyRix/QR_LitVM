'use client'
import { Badge } from '@/components/ui/badge'

interface Props {
  paid: boolean
  payer?: string
}

export function PaymentStatus({ paid, payer }: Props) {
  return paid ? (
    <div className="space-y-1">
      <Badge className="bg-green-500 text-white">Оплачено</Badge>
      {payer && payer !== '0x0000000000000000000000000000000000000000' && (
        <p className="text-xs text-muted-foreground font-mono">
          от {payer.slice(0, 6)}...{payer.slice(-4)}
        </p>
      )}
    </div>
  ) : (
    <Badge variant="outline">Ожидает оплаты</Badge>
  )
}
