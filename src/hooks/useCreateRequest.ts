'use client'
import { useState } from 'react'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { CONTRACT_ADDRESS, CONTRACT_ABI, CONTRACT_VERSION } from '@/lib/contract'
import { ensureHealthyLitvmWalletRpc } from '@/lib/litvmNetwork'
import { PAYMENT_REQUEST_V3_ABI } from '@/lib/PaymentRequestV3.abi'
import { PAYMENT_REQUEST_V4_ABI } from '@/lib/PaymentRequestV4.abi'
import { PAYMENT_REQUEST_V5_ABI } from '@/lib/PaymentRequestV5.abi'
import { PAYMENT_REQUEST_V6_ABI } from '@/lib/PaymentRequestV6.abi'
import { isNativeToken } from '@/lib/tokens'
import { decodeEventLog, parseEther, parseUnits } from 'viem'

export function useCreateRequest() {
  const [localError, setLocalError] = useState<Error | null>(null)
  const [isPreparingWallet, setIsPreparingWallet] = useState(false)
  const { writeContractAsync, data: hash, isPending, error } = useWriteContract()

  async function create(
    amountRaw: string,
    label: string,
    reusable: boolean,
    recipientAddress?: `0x${string}`,
    payoutAddress?: `0x${string}`,
    tokenAddress?: `0x${string}` | null,
    tokenDecimals?: number,
  ) {
    setLocalError(null)
    setIsPreparingWallet(true)

    try {
      await ensureHealthyLitvmWalletRpc()

      const isToken = !isNativeToken(tokenAddress)
      const amount = amountRaw
        ? isToken
          ? parseUnits(amountRaw, tokenDecimals ?? 6)
          : parseEther(amountRaw)
        : 0n

      // ─── V6 Token requests ────────────────────────────────────────────
      if (isToken && CONTRACT_VERSION === 'v6') {
        if (recipientAddress) {
          const fnName = reusable ? 'createReusableTokenRequestFor' : 'createTokenRequestFor'
          await writeContractAsync({
            address: CONTRACT_ADDRESS,
            abi: PAYMENT_REQUEST_V6_ABI,
            functionName: fnName,
            args: [recipientAddress, tokenAddress!, amount, label],
          })
        } else {
          const fnName = reusable ? 'createReusableTokenRequest' : 'createTokenRequest'
          await writeContractAsync({
            address: CONTRACT_ADDRESS,
            abi: PAYMENT_REQUEST_V6_ABI,
            functionName: fnName,
            args: [tokenAddress!, amount, label],
          })
        }
        return
      }

      // ─── Native zkLTC requests (existing logic) ───────────────────────
      if (recipientAddress && (CONTRACT_VERSION === 'v4' || CONTRACT_VERSION === 'v5' || CONTRACT_VERSION === 'v6')) {
        if ((CONTRACT_VERSION === 'v5' || CONTRACT_VERSION === 'v6') && payoutAddress) {
          await writeContractAsync({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_VERSION === 'v6' ? PAYMENT_REQUEST_V6_ABI : PAYMENT_REQUEST_V5_ABI,
            functionName: reusable ? 'createReusableRequestForWithPayout' : 'createRequestForWithPayout',
            args: [recipientAddress, amount, label, payoutAddress],
          })
          return
        }

        await writeContractAsync({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_VERSION === 'v6'
            ? PAYMENT_REQUEST_V6_ABI
            : CONTRACT_VERSION === 'v5'
              ? PAYMENT_REQUEST_V5_ABI
              : PAYMENT_REQUEST_V4_ABI,
          functionName: reusable ? 'createReusableRequestFor' : 'createRequestFor',
          args: [recipientAddress, amount, label],
        })
        return
      }

      if ((CONTRACT_VERSION === 'v5' || CONTRACT_VERSION === 'v6') && payoutAddress) {
        await writeContractAsync({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_VERSION === 'v6' ? PAYMENT_REQUEST_V6_ABI : PAYMENT_REQUEST_V5_ABI,
          functionName: reusable ? 'createReusableRequestWithPayout' : 'createRequestWithPayout',
          args: [amount, label, payoutAddress],
        })
        return
      }

      if (reusable && (CONTRACT_VERSION === 'v3' || CONTRACT_VERSION === 'v4' || CONTRACT_VERSION === 'v5' || CONTRACT_VERSION === 'v6')) {
        await writeContractAsync({
          address: CONTRACT_ADDRESS,
          abi:
            CONTRACT_VERSION === 'v6'
              ? PAYMENT_REQUEST_V6_ABI
              : CONTRACT_VERSION === 'v5'
                ? PAYMENT_REQUEST_V5_ABI
                : CONTRACT_VERSION === 'v4'
                  ? PAYMENT_REQUEST_V4_ABI
                  : PAYMENT_REQUEST_V3_ABI,
          functionName: 'createReusableRequest',
          args: [amount, label],
        })
        return
      }

      await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'createRequest',
        args: [amount, label],
      })
    } catch (caughtError) {
      setLocalError(caughtError instanceof Error ? caughtError : new Error('Unable to create the payment link.'))
    } finally {
      setIsPreparingWallet(false)
    }
  }

  const { isLoading: isConfirming, data: receipt } =
    useWaitForTransactionReceipt({ hash })

  const requestId = receipt?.logs
    ?.map(log => {
      try {
        const decoded = decodeEventLog({
          abi:
            CONTRACT_VERSION === 'v6'
              ? PAYMENT_REQUEST_V6_ABI
              : CONTRACT_VERSION === 'v5'
                ? PAYMENT_REQUEST_V5_ABI
                : CONTRACT_VERSION === 'v4'
                  ? PAYMENT_REQUEST_V4_ABI
                  : CONTRACT_ABI,
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

  return {
    create,
    hash,
    isPending,
    isPreparingWallet,
    isConfirming,
    requestId,
    error: localError ?? error,
  }
}
