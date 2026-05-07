'use client'

import { useEffect, useState } from 'react'
import { usePublicClient } from 'wagmi'
import { CONTRACT_ADDRESS, CONTRACT_VERSION } from '@/lib/contract'
import { PAYMENT_REQUEST_V5_ABI } from '@/lib/PaymentRequestV5.abi'

export type RequestPayment = {
  payer: `0x${string}`
  amount: bigint
  paidAt: bigint
}

export function useRequestPayments(
  id: `0x${string}` | undefined,
  paymentCount: bigint | undefined,
  limit = 5,
) {
  const publicClient = usePublicClient()
  const [payments, setPayments] = useState<RequestPayment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (CONTRACT_VERSION !== 'v5' || !publicClient || !id || !paymentCount || paymentCount === 0n) {
      setPayments([])
      setIsLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    const client = publicClient
    const requestId = id

    async function loadPayments() {
      setIsLoading(true)
      setError(null)

      try {
        const resolvedPaymentCount = paymentCount ?? 0n
        const maxItems = BigInt(Math.min(Number(resolvedPaymentCount), limit))
        const startIndex = resolvedPaymentCount > maxItems ? resolvedPaymentCount - maxItems : 0n
        const indices = Array.from({ length: Number(maxItems) }, (_, index) => startIndex + BigInt(index))

        const results = await Promise.all(
          indices.map(index =>
            client.readContract({
              address: CONTRACT_ADDRESS,
              abi: PAYMENT_REQUEST_V5_ABI,
              functionName: 'getPayment',
              args: [requestId, index],
            }),
          ),
        )

        if (cancelled) {
          return
        }

        const normalized = results
          .map(result => {
            const [payer, amount, paidAt] = result as readonly [`0x${string}`, bigint, bigint]
            return { payer, amount, paidAt }
          })
          .sort((left, right) => Number(right.paidAt - left.paidAt))

        setPayments(normalized)
      } catch (caughtError) {
        if (!cancelled) {
          setError(
            caughtError instanceof Error ? caughtError.message : 'Failed to load payment history.',
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadPayments()

    return () => {
      cancelled = true
    }
  }, [id, limit, paymentCount, publicClient])

  return { payments, isLoading, error }
}
