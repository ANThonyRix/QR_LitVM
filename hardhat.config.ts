import { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const config: HardhatUserConfig = {
  solidity: '0.8.24',
  networks: {
    litvm: {
      url: process.env.LITVM_RPC_URL ?? '',
      accounts: process.env.DEPLOYER_PRIVATE_KEY
        ? [process.env.DEPLOYER_PRIVATE_KEY]
        : [],
    },
  },
}
export default config
