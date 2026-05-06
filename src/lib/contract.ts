import { PAYMENT_REQUEST_ABI } from './PaymentRequest.abi'

export const DEFAULT_CONTRACT_ADDRESS =
  '0xb655Cf15C7faB15FF5021374d5030910daFe30d3' as const

export const CONTRACT_ADDRESS =
  (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? DEFAULT_CONTRACT_ADDRESS) as `0x${string}`

export const CONTRACT_ABI = PAYMENT_REQUEST_ABI
