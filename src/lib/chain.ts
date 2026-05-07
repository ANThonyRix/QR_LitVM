import { defineChain } from 'viem'
import { LITVM_BACKUP_RPC_URL, LITVM_DEFAULT_RPC_URL } from './litvmNetwork'

export const litvm = defineChain({
  id: Number(process.env.NEXT_PUBLIC_LITVM_CHAIN_ID ?? '4441'),
  name: 'LitVM Liteforge Testnet',
  nativeCurrency: {
    name: 'zkLTC',
    symbol: 'zkLTC',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: [LITVM_DEFAULT_RPC_URL, LITVM_BACKUP_RPC_URL] },
  },
  blockExplorers: {
    default: {
      name: 'Liteforge Explorer',
      url: 'https://liteforge.explorer.caldera.xyz',
    },
  },
  testnet: true,
})
