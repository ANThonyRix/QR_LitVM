'use client'
import { useReadContract } from 'wagmi'
import { CONTRACT_ADDRESS, CONTRACT_ABI, CONTRACT_VERSION } from '@/lib/contract'

export type PaymentRequest = {
  recipient: `0x${string}`
  amount: bigint
  label: string
  createdAt: bigint
  paid: boolean
  payer: `0x${string}`
  paidAt: bigint
  reusable: boolean
  paymentCount: bigint
  totalPaid: bigint
}

type RawPaymentRequest =
  | readonly [`0x${string}`, bigint, string, bigint, boolean, `0x${string}`, bigint, boolean, bigint, bigint]
  | readonly [`0x${string}`, bigint, string, bigint, boolean, `0x${string}`, bigint]
  | readonly [`0x${string}`, bigint, string, boolean, `0x${string}`, bigint]
  | PaymentRequest
  | undefined

export function usePaymentRequest(id: `0x${string}` | undefined) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'requests',
    args: id ? [id] : undefined,
    query: { enabled: !!id, refetchInterval: 15000 },
  })

  const rawRequest = data as RawPaymentRequest

  const request: PaymentRequest | undefined = Array.isArray(rawRequest)
    ? CONTRACT_VERSION === 'v3'
      ? {
          recipient: rawRequest[0],
          amount: rawRequest[1],
          label: rawRequest[2],
          createdAt: rawRequest[3] as bigint,
          paid: rawRequest[4] as boolean,
          payer: rawRequest[5] as `0x${string}`,
          paidAt: rawRequest[6] as bigint,
          reusable: rawRequest[7] as boolean,
          paymentCount: rawRequest[8] as bigint,
          totalPaid: rawRequest[9] as bigint,
        }
      : CONTRACT_VERSION === 'v2'
        ? {
            recipient: rawRequest[0],
            amount: rawRequest[1],
            label: rawRequest[2],
            createdAt: rawRequest[3] as bigint,
            paid: rawRequest[4] as boolean,
            payer: rawRequest[5] as `0x${string}`,
            paidAt: rawRequest[6] as bigint,
            reusable: false,
            paymentCount: rawRequest[4] ? 1n : 0n,
            totalPaid: 0n,
          }
      : {
          recipient: rawRequest[0],
          amount: rawRequest[1],
          label: rawRequest[2],
          createdAt: 0n,
          paid: rawRequest[3] as boolean,
          payer: rawRequest[4] as `0x${string}`,
          paidAt: rawRequest[5] as bigint,
          reusable: false,
          paymentCount: rawRequest[3] ? 1n : 0n,
          totalPaid: 0n,
        }
    : (rawRequest as PaymentRequest | undefined)

  return { request, isLoading, error, refetch }
}
