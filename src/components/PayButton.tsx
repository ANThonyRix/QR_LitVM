'use client'
import { useState } from 'react'
import { useAccount } from 'wagmi'
import { usePay } from '@/hooks/usePay'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatEther } from 'viem'

interface Props {
  requestId: `0x${string}`
  fixedAmount: bigint
  paid: boolean
}

export function PayButton({ requestId, fixedAmount, paid }: Props) {
  const { isConnected } = useAccount()
  const { pay, isPending, isConfirming, isSuccess, error } = usePay()
  const [customAmount, setCustomAmount] = useState('')

  if (paid || isSuccess) {
    return <p className="text-green-600 font-medium">Payment confirmed!</p>
  }

  if (!isConnected) {
    return <p className="text-sm text-muted-foreground">Connect wallet to pay</p>
  }

  const amount = fixedAmount > 0n ? formatEther(fixedAmount) : customAmount

  return (
    <div className="space-y-3">
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
