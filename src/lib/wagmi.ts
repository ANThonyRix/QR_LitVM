import { createConfig, http, injected } from 'wagmi'
import { coinbaseWallet, metaMask } from 'wagmi/connectors'
import { litvm } from './chain'

const appName = 'QR LitVM'
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://qr-litvm.vercel.app'

export const wagmiConfig = createConfig({
  chains: [litvm],
  connectors: [
    injected({
      shimDisconnect: true,
      unstable_shimAsyncInject: 4_000,
    }),
    metaMask({
      dappMetadata: {
        name: appName,
        url: appUrl,
      },
    }),
    coinbaseWallet({
      appName,
    }),
  ],
  transports: {
    [litvm.id]: http(),
  },
  ssr: true,
})
