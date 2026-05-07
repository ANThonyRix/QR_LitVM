import { PAYMENT_REQUEST_ABI } from './PaymentRequest.abi'
import { PAYMENT_REQUEST_V1_ABI } from './PaymentRequestV1.abi'
import { PAYMENT_REQUEST_V3_ABI } from './PaymentRequestV3.abi'
import { PAYMENT_REQUEST_V4_ABI } from './PaymentRequestV4.abi'

export const DEFAULT_CONTRACT_ADDRESS =
  '0xb146948808c8efBB44958E35E6d5bd1d36C8aF31' as const

export const DEFAULT_CONTRACT_VERSION = 'v3' as const

export const DEFAULT_CONTRACT_DEPLOYMENT_BLOCK = 6067830n

type ContractVersion = 'v1' | 'v2' | 'v3' | 'v4'

export const CONTRACT_ADDRESS =
  (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? DEFAULT_CONTRACT_ADDRESS) as `0x${string}`

export const CONTRACT_VERSION: ContractVersion =
  process.env.NEXT_PUBLIC_CONTRACT_VERSION === 'v1'
    ? 'v1'
    : process.env.NEXT_PUBLIC_CONTRACT_VERSION === 'v2'
      ? 'v2'
      : process.env.NEXT_PUBLIC_CONTRACT_VERSION === 'v3'
        ? 'v3'
        : process.env.NEXT_PUBLIC_CONTRACT_VERSION === 'v4'
          ? 'v4'
        : DEFAULT_CONTRACT_VERSION

export const CONTRACT_DEPLOYMENT_BLOCK = BigInt(
  process.env.NEXT_PUBLIC_CONTRACT_DEPLOYMENT_BLOCK ?? DEFAULT_CONTRACT_DEPLOYMENT_BLOCK,
)

export const CONTRACT_ABI =
  CONTRACT_VERSION === 'v1'
    ? PAYMENT_REQUEST_V1_ABI
    : CONTRACT_VERSION === 'v4'
      ? PAYMENT_REQUEST_V4_ABI
    : CONTRACT_VERSION === 'v3'
      ? PAYMENT_REQUEST_V3_ABI
      : PAYMENT_REQUEST_ABI
