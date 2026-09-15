'use client'

import { useState } from 'react'
import { useAccount, usePublicClient, useWriteContract } from 'wagmi'
import { decodeEventLog, parseEther, parseUnits } from 'viem'
import { CONTRACT_ADDRESS, CONTRACT_VERSION } from '@/lib/contract'
import { ERC20_ABI } from '@/lib/erc20.abi'
import { isNativeToken } from '@/lib/tokens'
import { ensureHealthyLitvmWalletRpc } from '@/lib/litvmNetwork'
import { rememberRequestId } from '@/lib/historyCache'
import { ONCHAIN_HISTORY_REFRESH_EVENT } from '@/hooks/useOnchainHistory'
import { PAYMENT_REQUEST_V4_ABI } from '@/lib/PaymentRequestV4.abi'
import { PAYMENT_REQUEST_V5_ABI } from '@/lib/PaymentRequestV5.abi'
import { PAYMENT_REQUEST_V6_ABI } from '@/lib/PaymentRequestV6.abi'

type DirectPaymentStatus =
  | 'idle'
  | 'preparing_wallet'
  | 'confirm_create'
  | 'waiting_create'
  | 'confirm_approve'
  | 'waiting_approve'
  | 'confirm_payment'
  | 'waiting_payment'
  | 'success'

export function useDirectPayment() {
  const publicClient = usePublicClient()
  const { address } = useAccount()
  const { writeContractAsync } = useWriteContract()

  const [status, setStatus] = useState<DirectPaymentStatus>('idle')
  const [error, setError] = useState<Error | null>(null)
  const [requestId, setRequestId] = useState<`0x${string}` | null>(null)

  const sendPayment = async ({
    recipientAddress,
    amount,
    label,
    tokenAddress,
    tokenDecimals,
  }: {
    recipientAddress: `0x${string}`
    amount: string
    label: string
    tokenAddress?: `0x${string}` | null
    tokenDecimals?: number
  }) => {
    if (CONTRACT_VERSION !== 'v4' && CONTRACT_VERSION !== 'v5' && CONTRACT_VERSION !== 'v6') {
      setError(new Error('Direct username payments require the v4, v5, or v6 contract.'))
      return null
    }

    if (!publicClient || !address) {
      setError(new Error('Public client or wallet is not available.'))
      return null
    }

    setError(null)
    setRequestId(null)

    const isToken = !isNativeToken(tokenAddress)

    try {
      setStatus('preparing_wallet')
      await ensureHealthyLitvmWalletRpc()

      const parsedAmount = isToken
        ? parseUnits(amount, tokenDecimals ?? 6)
        : parseEther(amount)

      // Create request
      setStatus('confirm_create')
      let createHash: `0x${string}`

      if (isToken && CONTRACT_VERSION === 'v6') {
        createHash = await writeContractAsync({
          address: CONTRACT_ADDRESS,
          abi: PAYMENT_REQUEST_V6_ABI,
          functionName: 'createTokenRequestFor',
          args: [recipientAddress, tokenAddress!, parsedAmount, label],
        })
      } else {
        createHash = await writeContractAsync({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_VERSION === 'v6'
            ? PAYMENT_REQUEST_V6_ABI
            : CONTRACT_VERSION === 'v5'
              ? PAYMENT_REQUEST_V5_ABI
              : PAYMENT_REQUEST_V4_ABI,
          functionName: 'createRequestFor',
          args: [recipientAddress, parsedAmount, label],
        })
      }

      setStatus('waiting_create')
      const createReceipt = await publicClient.waitForTransactionReceipt({ hash: createHash })

      const abi = CONTRACT_VERSION === 'v6'
        ? PAYMENT_REQUEST_V6_ABI
        : CONTRACT_VERSION === 'v5'
          ? PAYMENT_REQUEST_V5_ABI
          : PAYMENT_REQUEST_V4_ABI

      const createdRequestId = createReceipt.logs
        .map(log => {
          try {
            const decoded = decodeEventLog({
              abi,
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
      rememberRequestId(address, 'created', createdRequestId)

      // Approve token if needed
      if (isToken) {
        const allowance = await publicClient.readContract({
          address: tokenAddress!,
          abi: ERC20_ABI,
          functionName: 'allowance',
          args: [address, CONTRACT_ADDRESS],
        })

        if ((allowance as bigint) < parsedAmount) {
          setStatus('confirm_approve')
          const approveHash = await writeContractAsync({
            address: tokenAddress!,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [CONTRACT_ADDRESS, parsedAmount],
          })

          setStatus('waiting_approve')
          await publicClient.waitForTransactionReceipt({ hash: approveHash })
        }
      }

      // Pay
      setStatus('confirm_payment')
      let payHash: `0x${string}`

      if (isToken && CONTRACT_VERSION === 'v6') {
        payHash = await writeContractAsync({
          address: CONTRACT_ADDRESS,
          abi: PAYMENT_REQUEST_V6_ABI,
          functionName: 'payWithToken',
          args: [createdRequestId, parsedAmount],
        })
      } else {
        payHash = await writeContractAsync({
          address: CONTRACT_ADDRESS,
          abi: abi,
          functionName: 'pay',
          args: [createdRequestId],
          value: parsedAmount,
        })
      }

      setStatus('waiting_payment')
      await publicClient.waitForTransactionReceipt({ hash: payHash })
      rememberRequestId(address, 'paid', createdRequestId)

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
