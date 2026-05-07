'use client'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { CONTRACT_ADDRESS, CONTRACT_ABI, CONTRACT_VERSION } from '@/lib/contract'
import { PAYMENT_REQUEST_V3_ABI } from '@/lib/PaymentRequestV3.abi'
import { decodeEventLog, parseEther } from 'viem'

export function useCreateRequest() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()

  function create(amountEth: string, label: string, reusable: boolean) {
    const amount = amountEth ? parseEther(amountEth) : 0n
    if (reusable && CONTRACT_VERSION === 'v3') {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: PAYMENT_REQUEST_V3_ABI,
        functionName: 'createReusableRequest',
        args: [amount, label],
      })
      return
    }

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
