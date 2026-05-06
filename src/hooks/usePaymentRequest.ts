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

type RawPaymentRequest =
  | readonly [`0x${string}`, bigint, string, boolean, `0x${string}`, bigint]
  | PaymentRequest
  | undefined

export function usePaymentRequest(id: `0x${string}` | undefined) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'requests',
    args: id ? [id] : undefined,
    query: { enabled: !!id, refetchInterval: 5000 },
  })

  const rawRequest = data as RawPaymentRequest

  const request: PaymentRequest | undefined = Array.isArray(rawRequest)
    ? {
        recipient: rawRequest[0],
        amount: rawRequest[1],
        label: rawRequest[2],
        paid: rawRequest[3],
        payer: rawRequest[4],
        paidAt: rawRequest[5],
      }
    : (rawRequest as PaymentRequest | undefined)

  return { request, isLoading, error, refetch }
}
