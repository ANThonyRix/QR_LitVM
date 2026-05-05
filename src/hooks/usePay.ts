'use client'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contract'
import { parseEther } from 'viem'

export function usePay() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()

  function pay(requestId: `0x${string}`, amountEth: string) {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'pay',
      args: [requestId],
      value: parseEther(amountEth),
    })
  }

  const { isLoading: isConfirming, isSuccess } =
    useWaitForTransactionReceipt({ hash })

  return { pay, hash, isPending, isConfirming, isSuccess, error }
}
