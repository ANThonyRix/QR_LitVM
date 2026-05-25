'use client'
import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { usePay } from '@/hooks/usePay'
import { isBandwidthLimitError } from '@/lib/litvmNetwork'
import { getTokenByAddress, isNativeToken } from '@/lib/tokens'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { WalletRpcRecoveryNotice } from '@/components/WalletRpcRecoveryNotice'
import { formatEther, formatUnits } from 'viem'

interface Props {
  requestId: `0x${string}`
  fixedAmount: bigint
  isClosed: boolean
  reusable: boolean
  tokenAddress?: `0x${string}` | null
}

export function PayButton({ requestId, fixedAmount, isClosed, reusable, tokenAddress }: Props) {
  const { isConnected } = useAccount()
  const { pay, isPending, isPreparingWallet, isApproving, isConfirming, isSuccess, error } = usePay()
  const [customAmount, setCustomAmount] = useState('')

  const token = getTokenByAddress(tokenAddress ?? null)
  const isNative = isNativeToken(tokenAddress)

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

  const formattedAmount = fixedAmount > 0n
    ? isNative
      ? formatEther(fixedAmount)
      : formatUnits(fixedAmount, token.decimals)
    : customAmount

  const amount = formattedAmount

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
          placeholder={`Enter ${token.symbol} amount`}
          value={customAmount}
          onChange={e => setCustomAmount(e.target.value)}
          min={isNative ? '0.001' : '0.01'}
          step={isNative ? '0.001' : '0.01'}
        />
      )}
      <Button
        className="w-full"
        size="lg"
        disabled={!amount || isPending || isPreparingWallet || isApproving || isConfirming}
        onClick={() => void pay(requestId, amount, tokenAddress, token.decimals)}
      >
        {isPreparingWallet ? 'Checking wallet network...' :
         isApproving ? `Approving ${token.symbol}...` :
         isPending ? 'Confirm in wallet...' :
         isConfirming ? 'Processing...' :
         `Pay ${amount} ${token.symbol}`}
      </Button>
      <WalletRpcRecoveryNotice error={error} />
      {error && !isBandwidthLimitError(error) && (
        <p className="text-sm text-destructive">{(error as Error).message}</p>
      )}
    </div>
  )
}
