import { ethers } from 'hardhat'

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log('Deploying from:', deployer.address)

  const Contract = await ethers.getContractFactory('PaymentRequest')
  const contract = await Contract.deploy()
  await contract.waitForDeployment()
  const deploymentReceipt = await contract.deploymentTransaction()?.wait()

  const address = await contract.getAddress()
  console.log('PaymentRequest deployed to:', address)
  console.log('')
  console.log('Next step - add to .env.local:')
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${address}`)
  console.log('NEXT_PUBLIC_CONTRACT_VERSION=v4')
  if (deploymentReceipt?.blockNumber !== undefined) {
    console.log(`NEXT_PUBLIC_CONTRACT_DEPLOYMENT_BLOCK=${deploymentReceipt.blockNumber}`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
