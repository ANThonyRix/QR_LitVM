import { defineConfig } from "hardhat/config";
import hardhatEthers from "@nomicfoundation/hardhat-ethers";
import hardhatMocha from "@nomicfoundation/hardhat-mocha";
import hardhatChaiMatchers from "@nomicfoundation/hardhat-ethers-chai-matchers";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

export default defineConfig({
  plugins: [hardhatEthers, hardhatMocha, hardhatChaiMatchers],
  solidity: {
    profiles: {
      default: {
        version: "0.8.24",
      },
      production: {
        version: "0.8.24",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    ...(process.env.LITVM_RPC_URL
      ? {
          litvm: {
            type: "http",
            chainType: "generic",
            url: process.env.LITVM_RPC_URL,
            chainId: 4441,
            accounts: process.env.DEPLOYER_PRIVATE_KEY
              ? [process.env.DEPLOYER_PRIVATE_KEY]
              : "remote",
          },
        }
      : {}),
  },
});
