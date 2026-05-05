'use client'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contract'
import { parseEther } from 'viem'

export function useCreateRequest() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()

  function create(amountEth: string, label: string) {
    const amount = amountEth ? parseEther(amountEth) : 0n
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'createRequest',
      args: [amount, label],
    })
  }

  const { isLoading: isConfirming, data: receipt } =
    useWaitForTransactionReceipt({ hash })

  const requestId = receipt?.logs?.[0]?.topics?.[1] as `0x${string}` | undefined

  return { create, hash, isPending, isConfirming, requestId, error }
}
