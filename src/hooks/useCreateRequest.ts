'use client'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contract'
import { decodeEventLog, parseEther } from 'viem'

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

  const requestId = receipt?.logs
    ?.map(log => {
      try {
        const decoded = decodeEventLog({
          abi: CONTRACT_ABI,
          data: log.data,
          topics: log.topics,
        })

        return decoded.eventName === 'RequestCreated'
          ? (decoded.args.id as `0x${string}`)
          : undefined
      } catch {
        return undefined
      }
    })
    .find(Boolean)

  return { create, hash, isPending, isConfirming, requestId, error }
}
