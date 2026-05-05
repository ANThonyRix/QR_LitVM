import { defineConfig } from 'hardhat/config'
import hardhatEthers from '@nomicfoundation/hardhat-ethers'
import hardhatMocha from '@nomicfoundation/hardhat-mocha'
import hardhatChaiMatchers from '@nomicfoundation/hardhat-ethers-chai-matchers'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

export default defineConfig({
  plugins: [hardhatEthers, hardhatMocha, hardhatChaiMatchers],
  solidity: '0.8.24',
  ...(process.env.LITVM_RPC_URL
    ? {
        networks: {
          litvm: {
            type: 'http' as const,
            url: process.env.LITVM_RPC_URL,
            accounts: process.env.DEPLOYER_PRIVATE_KEY
              ? [process.env.DEPLOYER_PRIVATE_KEY]
              : ('remote' as const),
          },
        },
      }
    : {}),
})
