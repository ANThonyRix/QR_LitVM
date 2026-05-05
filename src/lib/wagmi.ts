import { createConfig, http } from 'wagmi'
import { litvm } from './chain'

export const wagmiConfig = createConfig({
  chains: [litvm],
  transports: {
    [litvm.id]: http(),
  },
  ssr: true,
})
