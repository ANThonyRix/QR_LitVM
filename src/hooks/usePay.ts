'use client'
import { useState } from 'react'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contract'
import { ensureHealthyLitvmWalletRpc } from '@/lib/litvmNetwork'
import { parseEther } from 'viem'

export function usePay() {
  const [localError, setLocalError] = useState<Error | null>(null)
  const [isPreparingWallet, setIsPreparingWallet] = useState(false)
  const { writeContractAsync, data: hash, isPending, error } = useWriteContract()

  async function pay(requestId: `0x${string}`, amountEth: string) {
    setLocalError(null)
    setIsPreparingWallet(true)

    try {
      await ensureHealthyLitvmWalletRpc()
      await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'pay',
        args: [requestId],
        value: parseEther(amountEth),
      })
    } catch (caughtError) {
      setLocalError(caughtError instanceof Error ? caughtError : new Error('Unable to complete the payment.'))
    } finally {
      setIsPreparingWallet(false)
    }
  }

  const { isLoading: isConfirming, isSuccess } =
    useWaitForTransactionReceipt({ hash })

  return {
    pay,
    hash,
    isPending,
    isPreparingWallet,
    isConfirming,
    isSuccess,
    error: localError ?? error,
  }
}
