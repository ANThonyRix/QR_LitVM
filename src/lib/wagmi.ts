import { connectorsForWallets } from '@rainbow-me/rainbowkit'
import { coinbaseWallet, injectedWallet, metaMaskWallet } from '@rainbow-me/rainbowkit/wallets'
import { createConfig, http } from 'wagmi'
import { litvm } from './chain'

const appName = 'QR LitVM'
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://qr-litvm.vercel.app'
const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? 'YOUR_PROJECT_ID'

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [
        metaMaskWallet,
        injectedWallet,
        coinbaseWallet,
      ],
    },
  ],
  {
    appName,
    appUrl,
    projectId: walletConnectProjectId,
  },
)

export const wagmiConfig = createConfig({
  chains: [litvm],
  connectors,
  transports: {
    [litvm.id]: http(),
  },
  ssr: true,
})
