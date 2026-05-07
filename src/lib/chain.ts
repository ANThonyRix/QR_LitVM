import { defineChain } from 'viem'

const primaryRpcUrl =
  process.env.NEXT_PUBLIC_LITVM_RPC_URL ?? 'https://liteforge.rpc.caldera.xyz/infra-partner-http'

const fallbackRpcUrl =
  process.env.NEXT_PUBLIC_LITVM_RPC_FALLBACK_URL ?? 'https://liteforge.rpc.caldera.xyz/http'

export const litvm = defineChain({
  id: Number(process.env.NEXT_PUBLIC_LITVM_CHAIN_ID ?? '4441'),
  name: 'LitVM Liteforge Testnet',
  nativeCurrency: {
    name: 'zkLTC',
    symbol: 'zkLTC',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: [primaryRpcUrl, fallbackRpcUrl] },
  },
  blockExplorers: {
    default: {
      name: 'Liteforge Explorer',
      url: 'https://liteforge.explorer.caldera.xyz',
    },
  },
  testnet: true,
})
