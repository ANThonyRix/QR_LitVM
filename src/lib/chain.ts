import { defineChain } from 'viem'

export const litvm = defineChain({
  id: Number(process.env.NEXT_PUBLIC_LITVM_CHAIN_ID ?? '1135'),
  name: 'LitVM Liteforge Testnet',
  nativeCurrency: {
    name: 'zkLTC',
    symbol: 'zkLTC',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_LITVM_RPC_URL ?? 'https://rpc.litvm.io'] },
  },
  blockExplorers: {
    default: {
      name: 'Liteforge Explorer',
      url: 'https://liteforge.explorer.caldera.xyz',
    },
  },
  testnet: true,
})
