'use client'
import { useState } from 'react'
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contract'
import { ensureHealthyLitvmWalletRpc } from '@/lib/litvmNetwork'

export function useUsername() {
  const { address } = useAccount()

  const { data: myUsername, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'addressToUsername',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  const [localError, setLocalError] = useState<Error | null>(null)
  const [isPreparingWallet, setIsPreparingWallet] = useState(false)
  const { writeContractAsync, data: hash, isPending, error } = useWriteContract()

  const register = async (username: string) => {
    setLocalError(null)
    setIsPreparingWallet(true)

    try {
      await ensureHealthyLitvmWalletRpc()
      await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'registerUsername',
        args: [username],
      })
    } catch (caughtError) {
      setLocalError(caughtError instanceof Error ? caughtError : new Error('Unable to register the username.'))
    } finally {
      setIsPreparingWallet(false)
    }
  }

  const change = async (newUsername: string) => {
    setLocalError(null)
    setIsPreparingWallet(true)

    try {
      await ensureHealthyLitvmWalletRpc()
      await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'changeUsername',
        args: [newUsername],
      })
    } catch (caughtError) {
      setLocalError(caughtError instanceof Error ? caughtError : new Error('Unable to change the username.'))
    } finally {
      setIsPreparingWallet(false)
    }
  }

  const { isLoading: isConfirming, isSuccess } =
    useWaitForTransactionReceipt({ hash })

  return {
    myUsername: myUsername as string | undefined,
    register,
    change,
    isPending,
    isPreparingWallet,
    isConfirming,
    isSuccess,
    error: localError ?? error,
    refetch,
  }
}

export function useAddressForUsername(username: string) {
  const { data, isLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'usernameToAddress',
    args: [username],
    query: { enabled: !!username },
  })
  return { address: data as `0x${string}` | undefined, isLoading }
}
