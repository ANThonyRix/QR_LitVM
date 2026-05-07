'use client'
import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { usePay } from '@/hooks/usePay'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatEther } from 'viem'

interface Props {
  requestId: `0x${string}`
  fixedAmount: bigint
  isClosed: boolean
  reusable: boolean
}

export function PayButton({ requestId, fixedAmount, isClosed, reusable }: Props) {
  const { isConnected } = useAccount()
  const { pay, isPending, isConfirming, isSuccess, error } = usePay()
  const [customAmount, setCustomAmount] = useState('')

  useEffect(() => {
    if (reusable && isSuccess && fixedAmount === 0n) {
      setCustomAmount('')
    }
  }, [fixedAmount, isSuccess, reusable])

  if (isClosed) {
    return <p className="text-green-600 font-medium">Payment confirmed!</p>
  }

  if (!isConnected) {
    return <p className="text-sm text-muted-foreground">Connect wallet to pay</p>
  }

  const amount = fixedAmount > 0n ? formatEther(fixedAmount) : customAmount

  return (
    <div className="space-y-3">
      {reusable && isSuccess && (
        <p className="text-sm text-green-600 font-medium">
          Payment confirmed. This reusable link can accept another payment.
        </p>
      )}
      {fixedAmount === 0n && (
        <Input
          type="number"
          placeholder="Enter zkLTC amount"
          value={customAmount}
          onChange={e => setCustomAmount(e.target.value)}
          min="0.001"
          step="0.001"
        />
      )}
      <Button
        className="w-full"
        size="lg"
        disabled={!amount || isPending || isConfirming}
        onClick={() => pay(requestId, amount)}
      >
        {isPending ? 'Confirm in wallet...' :
         isConfirming ? 'Processing...' :
         `Pay ${amount} zkLTC`}
      </Button>
      {error && <p className="text-sm text-destructive">{(error as Error).message}</p>}
    </div>
  )
}
