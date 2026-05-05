'use client'
import { useReadContract } from 'wagmi'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contract'

export type PaymentRequest = {
  recipient: `0x${string}`
  amount: bigint
  label: string
  paid: boolean
  payer: `0x${string}`
  paidAt: bigint
}

export function usePaymentRequest(id: `0x${string}` | undefined) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'requests',
    args: id ? [id] : undefined,
    query: { enabled: !!id, refetchInterval: 5000 },
  })

  return { request: data as PaymentRequest | undefined, isLoading, error, refetch }
}
