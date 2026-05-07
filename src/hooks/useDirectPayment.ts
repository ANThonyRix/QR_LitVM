'use client'

import { useState } from 'react'
import { usePublicClient, useWriteContract } from 'wagmi'
import { decodeEventLog, parseEther } from 'viem'
import { CONTRACT_ADDRESS, CONTRACT_VERSION } from '@/lib/contract'
import { ensureHealthyLitvmWalletRpc } from '@/lib/litvmNetwork'
import { ONCHAIN_HISTORY_REFRESH_EVENT } from '@/hooks/useOnchainHistory'
import { PAYMENT_REQUEST_V4_ABI } from '@/lib/PaymentRequestV4.abi'
import { PAYMENT_REQUEST_V5_ABI } from '@/lib/PaymentRequestV5.abi'

type DirectPaymentStatus =
  | 'idle'
  | 'preparing_wallet'
  | 'confirm_create'
  | 'waiting_create'
  | 'confirm_payment'
  | 'waiting_payment'
  | 'success'

export function useDirectPayment() {
  const publicClient = usePublicClient()
  const { writeContractAsync } = useWriteContract()

  const [status, setStatus] = useState<DirectPaymentStatus>('idle')
  const [error, setError] = useState<Error | null>(null)
  const [requestId, setRequestId] = useState<`0x${string}` | null>(null)

  const sendPayment = async ({
    recipientAddress,
    amount,
    label,
  }: {
    recipientAddress: `0x${string}`
    amount: string
    label: string
  }) => {
    if (CONTRACT_VERSION !== 'v4' && CONTRACT_VERSION !== 'v5') {
      setError(new Error('Direct username payments require the v4 or v5 contract.'))
      return null
    }

    if (!publicClient) {
      setError(new Error('Public client is not available.'))
      return null
    }

    setError(null)
    setRequestId(null)

    try {
      setStatus('preparing_wallet')
      await ensureHealthyLitvmWalletRpc()

      const parsedAmount = parseEther(amount)

      setStatus('confirm_create')
      const createHash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_VERSION === 'v5' ? PAYMENT_REQUEST_V5_ABI : PAYMENT_REQUEST_V4_ABI,
        functionName: CONTRACT_VERSION === 'v5' ? 'createRequestForWithPayout' : 'createRequestFor',
        args:
          CONTRACT_VERSION === 'v5'
            ? [recipientAddress, parsedAmount, label, recipientAddress]
            : [recipientAddress, parsedAmount, label],
      })

      setStatus('waiting_create')
      const createReceipt = await publicClient.waitForTransactionReceipt({ hash: createHash })

      const createdRequestId = createReceipt.logs
        .map(log => {
          try {
            const decoded = decodeEventLog({
              abi: CONTRACT_VERSION === 'v5' ? PAYMENT_REQUEST_V5_ABI : PAYMENT_REQUEST_V4_ABI,
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

      if (!createdRequestId) {
        throw new Error('Unable to read the generated payment request.')
      }

      setRequestId(createdRequestId)

      setStatus('confirm_payment')
      const payHash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_VERSION === 'v5' ? PAYMENT_REQUEST_V5_ABI : PAYMENT_REQUEST_V4_ABI,
        functionName: 'pay',
        args: [createdRequestId],
        value: parsedAmount,
      })

      setStatus('waiting_payment')
      await publicClient.waitForTransactionReceipt({ hash: payHash })

      setStatus('success')
      window.dispatchEvent(new Event(ONCHAIN_HISTORY_REFRESH_EVENT))
      return createdRequestId
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError : new Error('Unable to send the payment.'))
      setStatus('idle')
      return null
    }
  }

  const reset = () => {
    setStatus('idle')
    setError(null)
    setRequestId(null)
  }

  return {
    sendPayment,
    reset,
    status,
    error,
    requestId,
    isBusy: status !== 'idle' && status !== 'success',
    isSuccess: status === 'success',
  }
}
