'use client'
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contract'

export function useUsername() {
  const { address } = useAccount()

  const { data: myUsername, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'addressToUsername',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const register = (username: string) => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'registerUsername',
      args: [username],
    })
  }

  const change = (newUsername: string) => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'changeUsername',
      args: [newUsername],
    })
  }

  const { isLoading: isConfirming, isSuccess } =
    useWaitForTransactionReceipt({ hash })

  return {
    myUsername: myUsername as string | undefined,
    register,
    change,
    isPending,
    isConfirming,
    isSuccess,
    error,
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
