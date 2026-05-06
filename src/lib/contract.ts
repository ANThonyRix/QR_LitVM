import { PAYMENT_REQUEST_ABI } from './PaymentRequest.abi'
import { PAYMENT_REQUEST_V1_ABI } from './PaymentRequestV1.abi'

export const DEFAULT_CONTRACT_ADDRESS =
  '0xb655Cf15C7faB15FF5021374d5030910daFe30d3' as const

export const CONTRACT_ADDRESS =
  (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? DEFAULT_CONTRACT_ADDRESS) as `0x${string}`

export const CONTRACT_VERSION =
  process.env.NEXT_PUBLIC_CONTRACT_VERSION === 'v2' ? 'v2' : 'v1'

export const CONTRACT_DEPLOYMENT_BLOCK = BigInt(
  process.env.NEXT_PUBLIC_CONTRACT_DEPLOYMENT_BLOCK ?? '0',
)

export const CONTRACT_ABI =
  CONTRACT_VERSION === 'v2' ? PAYMENT_REQUEST_ABI : PAYMENT_REQUEST_V1_ABI
