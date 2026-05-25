'use client'

import { useReadContract } from 'wagmi'
import { CONTRACT_ADDRESS, CONTRACT_ABI, CONTRACT_VERSION } from '@/lib/contract'

export type PaymentRequest = {
  creator: `0x${string}`
  recipient: `0x${string}`
  payoutAddress?: `0x${string}`
  amount: bigint
  label: string
  createdAt: bigint
  paid: boolean
  payer: `0x${string}`
  paidAt: bigint
  reusable: boolean
  paymentCount: bigint
  totalPaid: bigint
  token: `0x${string}` | null
}

type RawV6PaymentRequest =
  readonly [`0x${string}`, `0x${string}`, bigint, string, bigint, boolean, `0x${string}`, bigint, boolean, bigint, bigint, `0x${string}`]

type RawV4PaymentRequest =
  readonly [`0x${string}`, `0x${string}`, bigint, string, bigint, boolean, `0x${string}`, bigint, boolean, bigint, bigint]

type RawV3PaymentRequest =
  readonly [`0x${string}`, bigint, string, bigint, boolean, `0x${string}`, bigint, boolean, bigint, bigint]

type RawV2PaymentRequest =
  readonly [`0x${string}`, bigint, string, bigint, boolean, `0x${string}`, bigint]

type RawV1PaymentRequest =
  readonly [`0x${string}`, bigint, string, boolean, `0x${string}`, bigint]

type RawPaymentRequest =
  | RawV6PaymentRequest
  | RawV4PaymentRequest
  | RawV3PaymentRequest
  | RawV2PaymentRequest
  | RawV1PaymentRequest
  | PaymentRequest
  | undefined

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as `0x${string}`

export function usePaymentRequest(id: `0x${string}` | undefined) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'requests',
    args: id ? [id] : undefined,
    query: { enabled: !!id, refetchInterval: 15000 },
  })

  const { data: payoutAddress } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'requestPayoutAddresses',
    args: id ? [id] : undefined,
    query: { enabled: (CONTRACT_VERSION === 'v5' || CONTRACT_VERSION === 'v6') && !!id, refetchInterval: 15000 },
  })

  const rawRequest = data as RawPaymentRequest

  const request: PaymentRequest | undefined = Array.isArray(rawRequest)
    ? CONTRACT_VERSION === 'v6'
      ? {
          creator: rawRequest[0] as `0x${string}`,
          recipient: rawRequest[1] as `0x${string}`,
          payoutAddress: payoutAddress as `0x${string}` | undefined,
          amount: rawRequest[2] as bigint,
          label: rawRequest[3] as string,
          createdAt: rawRequest[4] as bigint,
          paid: rawRequest[5] as boolean,
          payer: rawRequest[6] as `0x${string}`,
          paidAt: rawRequest[7] as bigint,
          reusable: rawRequest[8] as boolean,
          paymentCount: rawRequest[9] as bigint,
          totalPaid: rawRequest[10] as bigint,
          token: (rawRequest[11] as `0x${string}`) === ZERO_ADDRESS ? null : (rawRequest[11] as `0x${string}`),
        }
      : CONTRACT_VERSION === 'v4' || CONTRACT_VERSION === 'v5'
        ? {
            creator: rawRequest[0] as `0x${string}`,
            recipient: rawRequest[1] as `0x${string}`,
            payoutAddress: payoutAddress as `0x${string}` | undefined,
            amount: rawRequest[2] as bigint,
            label: rawRequest[3] as string,
            createdAt: rawRequest[4] as bigint,
            paid: rawRequest[5] as boolean,
            payer: rawRequest[6] as `0x${string}`,
            paidAt: rawRequest[7] as bigint,
            reusable: rawRequest[8] as boolean,
            paymentCount: rawRequest[9] as bigint,
            totalPaid: rawRequest[10] as bigint,
            token: null,
          }
        : CONTRACT_VERSION === 'v3'
          ? {
              creator: rawRequest[0] as `0x${string}`,
              recipient: rawRequest[0] as `0x${string}`,
              payoutAddress: undefined,
              amount: rawRequest[1] as bigint,
              label: rawRequest[2] as string,
              createdAt: rawRequest[3] as bigint,
              paid: rawRequest[4] as boolean,
              payer: rawRequest[5] as `0x${string}`,
              paidAt: rawRequest[6] as bigint,
              reusable: rawRequest[7] as boolean,
              paymentCount: rawRequest[8] as bigint,
              totalPaid: rawRequest[9] as bigint,
              token: null,
            }
          : CONTRACT_VERSION === 'v2'
            ? {
                creator: rawRequest[0] as `0x${string}`,
                recipient: rawRequest[0] as `0x${string}`,
                payoutAddress: undefined,
                amount: rawRequest[1] as bigint,
                label: rawRequest[2] as string,
                createdAt: rawRequest[3] as bigint,
                paid: rawRequest[4] as boolean,
                payer: rawRequest[5] as `0x${string}`,
                paidAt: rawRequest[6] as bigint,
                reusable: false,
                paymentCount: rawRequest[4] ? 1n : 0n,
                totalPaid: 0n,
                token: null,
              }
            : {
                creator: rawRequest[0] as `0x${string}`,
                recipient: rawRequest[0] as `0x${string}`,
                payoutAddress: undefined,
                amount: rawRequest[1] as bigint,
                label: rawRequest[2] as string,
                createdAt: 0n,
                paid: rawRequest[3] as boolean,
                payer: rawRequest[4] as `0x${string}`,
                paidAt: rawRequest[5] as bigint,
                reusable: false,
                paymentCount: rawRequest[3] ? 1n : 0n,
                totalPaid: 0n,
                token: null,
              }
    : (rawRequest as PaymentRequest | undefined)

  return { request, isLoading, error, refetch }
}
