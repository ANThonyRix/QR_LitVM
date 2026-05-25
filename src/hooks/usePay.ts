'use client'
import { useState } from 'react'
import { useAccount, usePublicClient, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contract'
import { ERC20_ABI } from '@/lib/erc20.abi'
import { ensureHealthyLitvmWalletRpc } from '@/lib/litvmNetwork'
import { isNativeToken } from '@/lib/tokens'
import { parseEther, parseUnits } from 'viem'

export function usePay() {
  const [localError, setLocalError] = useState<Error | null>(null)
  const [isPreparingWallet, setIsPreparingWallet] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const { writeContractAsync, data: hash, isPending, error } = useWriteContract()

  async function pay(
    requestId: `0x${string}`,
    amountRaw: string,
    tokenAddress?: `0x${string}` | null,
    tokenDecimals?: number,
  ) {
    setLocalError(null)
    setIsPreparingWallet(true)
    setIsApproving(false)

    try {
      await ensureHealthyLitvmWalletRpc()

      if (isNativeToken(tokenAddress)) {
        // Native zkLTC payment
        await writeContractAsync({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: 'pay',
          args: [requestId],
          value: parseEther(amountRaw),
        })
      } else {
        // ERC-20 token payment (approve + payWithToken)
        const amount = parseUnits(amountRaw, tokenDecimals ?? 6)

        if (!address || !publicClient) {
          throw new Error('Wallet not connected')
        }

        // Check current allowance
        const allowance = await publicClient.readContract({
          address: tokenAddress!,
          abi: ERC20_ABI,
          functionName: 'allowance',
          args: [address, CONTRACT_ADDRESS],
        })

        // Approve if needed
        if ((allowance as bigint) < amount) {
          setIsApproving(true)
          const approveHash = await writeContractAsync({
            address: tokenAddress!,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [CONTRACT_ADDRESS, amount],
          })
          await publicClient.waitForTransactionReceipt({ hash: approveHash })
          setIsApproving(false)
        }

        // Pay with token
        await writeContractAsync({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: 'payWithToken',
          args: [requestId, amount],
        })
      }
    } catch (caughtError) {
      setLocalError(caughtError instanceof Error ? caughtError : new Error('Unable to complete the payment.'))
    } finally {
      setIsPreparingWallet(false)
      setIsApproving(false)
    }
  }

  const { isLoading: isConfirming, isSuccess } =
    useWaitForTransactionReceipt({ hash })

  return {
    pay,
    hash,
    isPending,
    isPreparingWallet,
    isApproving,
    isConfirming,
    isSuccess,
    error: localError ?? error,
  }
}
