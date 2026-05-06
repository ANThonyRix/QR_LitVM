import { expect } from 'chai'
import { network } from 'hardhat'

const { ethers } = await network.create()

describe('PaymentRequest', function () {
  async function deploy() {
    const [owner, alice, bob] = await ethers.getSigners()
    const contract = await ethers.deployContract('PaymentRequest')
    const rejectingReceiver = await ethers.deployContract('RejectingReceiver')
    return { contract, rejectingReceiver, owner, alice, bob }
  }

  async function getRequestId(contract: any, tx: any) {
    const receipt = await tx.wait()
    let requestId: string | undefined

    for (const log of receipt.logs) {
      try {
        const parsed = contract.interface.parseLog(log)
        if (parsed?.name === 'RequestCreated') {
          requestId = parsed.args[0]
          break
        }
      } catch {
        // skip non-matching logs
      }
    }

    if (!requestId) {
      throw new Error('RequestCreated event not found')
    }

    return requestId
  }

  describe('createRequest', function () {
    it('emits RequestCreated with correct args', async function () {
      const { contract, owner } = await deploy()
      const amount = ethers.parseEther('1')
      const label = 'invoice #1'

      const tx = await contract.createRequest(amount, label)
      const receipt = await tx.wait()
      const block = await ethers.provider.getBlock(receipt!.blockNumber)

      await expect(tx)
        .to.emit(contract, 'RequestCreated')
        .withArgs(
          (id: string) => id !== ethers.ZeroHash,
          owner.address,
          amount,
          label,
          block!.timestamp,
        )
    })

    it('open-amount request (amount=0) is created successfully', async function () {
      const { contract, owner } = await deploy()

      await expect(contract.createRequest(0n, 'open'))
        .to.emit(contract, 'RequestCreated')
        .withArgs(
          (id: string) => id !== ethers.ZeroHash,
          owner.address,
          0n,
          'open',
          (createdAt: bigint | number) => Number(createdAt) > 0,
        )
    })

    it('stores createdAt and reports request existence', async function () {
      const { contract } = await deploy()
      const tx = await contract.createRequest(123n, 'timed request')
      const requestId = await getRequestId(contract, tx)
      const req = await contract.requests(requestId)

      expect(req.createdAt).to.be.greaterThan(0n)
      expect(await contract.requestExists(requestId)).to.equal(true)
      expect(await contract.requestExists(ethers.ZeroHash)).to.equal(false)
    })
  })

  describe('pay', function () {
    async function createFixedRequest(amount: bigint) {
      const { contract, owner, alice, bob } = await deploy()
      const tx = await contract.createRequest(amount, 'test')
      const requestId = await getRequestId(contract, tx)
      return { contract, owner, alice, bob, requestId }
    }

    it('pays exact amount, marks request as paid, and transfers to an EOA recipient immediately', async function () {
      const amount = ethers.parseEther('0.5')
      const { contract, owner, alice, requestId } = await createFixedRequest(amount)
      const before = await ethers.provider.getBalance(owner.address)
      const requestBeforePayment = await contract.requests(requestId)

      const payTx = await contract.connect(alice).pay(requestId, { value: amount })
      const receipt = await payTx.wait()
      const block = await ethers.provider.getBlock(receipt!.blockNumber)

      await expect(payTx)
        .to.emit(contract, 'RequestPaid')
        .withArgs(
          requestId,
          alice.address,
          owner.address,
          amount,
          requestBeforePayment.label,
          block!.timestamp,
        )

      const after = await ethers.provider.getBalance(owner.address)
      const req = await contract.requests(requestId)

      expect(req.paid).to.equal(true)
      expect(req.payer).to.equal(alice.address)
      expect(req.paidAt).to.equal(BigInt(block!.timestamp))
      expect(after - before).to.equal(amount)
      expect(await contract.pendingWithdrawals(owner.address)).to.equal(0n)
    })

    it('queues proceeds for contract recipients that reject direct transfers and lets them withdraw later', async function () {
      const { contract, rejectingReceiver, alice, bob } = await deploy()
      const amount = ethers.parseEther('0.15')
      const paymentRequestAddress = await contract.getAddress()
      const receiverAddress = await rejectingReceiver.getAddress()

      const tx = await rejectingReceiver.createRequest(paymentRequestAddress, amount, 'contract recipient')
      const requestId = await getRequestId(contract, tx)
      const requestBeforePayment = await contract.requests(requestId)

      const payTx = await contract.connect(alice).pay(requestId, { value: amount })
      const payReceipt = await payTx.wait()
      const payBlock = await ethers.provider.getBlock(payReceipt!.blockNumber)

      await expect(payTx)
        .to.emit(contract, 'ProceedsQueued')
        .withArgs(receiverAddress, amount)
        .and.to.emit(contract, 'RequestPaid')
        .withArgs(
          requestId,
          alice.address,
          receiverAddress,
          amount,
          requestBeforePayment.label,
          payBlock!.timestamp,
        )

      expect(await contract.pendingWithdrawals(receiverAddress)).to.equal(amount)

      const before = await ethers.provider.getBalance(bob.address)

      await expect(rejectingReceiver.withdrawTo(paymentRequestAddress, bob.address))
        .to.emit(contract, 'ProceedsWithdrawn')
        .withArgs(receiverAddress, bob.address, amount)

      const after = await ethers.provider.getBalance(bob.address)
      expect(after - before).to.equal(amount)
      expect(await contract.pendingWithdrawals(receiverAddress)).to.equal(0n)
    })

    it('lets an EOA recipient withdraw only when some proceeds were queued', async function () {
      const { contract, owner, bob } = await deploy()

      await expect(contract.connect(owner).withdrawProceeds(bob.address))
        .to.be.revertedWith('Nothing to withdraw')
    })

    it('reverts queued withdrawals to the zero address', async function () {
      const { contract, rejectingReceiver, alice } = await deploy()
      const amount = ethers.parseEther('0.15')
      const paymentRequestAddress = await contract.getAddress()
      const receiverAddress = await rejectingReceiver.getAddress()
      const tx = await rejectingReceiver.createRequest(paymentRequestAddress, amount, 'contract recipient')
      const requestId = await getRequestId(contract, tx)

      await expect(contract.connect(alice).pay(requestId, { value: amount }))
        .to.emit(contract, 'RequestPaid')
        .withArgs(
          requestId,
          alice.address,
          receiverAddress,
          amount,
          'contract recipient',
          (paidAt: bigint | number) => Number(paidAt) > 0,
        )

      expect(await contract.pendingWithdrawals(receiverAddress)).to.equal(amount)

      await expect(
        rejectingReceiver.withdrawTo(paymentRequestAddress, ethers.ZeroAddress),
      ).to.be.revertedWith('Zero address')
    })

    it('reverts when wrong amount is sent', async function () {
      const amount = ethers.parseEther('1')
      const { contract, alice, requestId } = await createFixedRequest(amount)

      await expect(
        contract.connect(alice).pay(requestId, { value: ethers.parseEther('0.5') }),
      ).to.be.revertedWith('Wrong amount')
    })

    it('reverts on double payment', async function () {
      const amount = ethers.parseEther('0.1')
      const { contract, alice, requestId } = await createFixedRequest(amount)

      await contract.connect(alice).pay(requestId, { value: amount })

      await expect(
        contract.connect(alice).pay(requestId, { value: amount }),
      ).to.be.revertedWith('Already paid')
    })

    it('open-amount request accepts any positive value', async function () {
      const { contract, owner, alice } = await deploy()
      const tx = await contract.createRequest(0n, 'open')
      const requestId = await getRequestId(contract, tx)
      const anyAmount = ethers.parseEther('0.42')

      await expect(
        contract.connect(alice).pay(requestId, { value: anyAmount }),
      )
        .to.emit(contract, 'RequestPaid')
        .withArgs(
          requestId,
          alice.address,
          owner.address,
          anyAmount,
          'open',
          (paidAt: bigint | number) => Number(paidAt) > 0,
        )

      expect(await contract.pendingWithdrawals(owner.address)).to.equal(0n)
    })

    it('rejects direct transfers to the contract', async function () {
      const { contract, owner } = await deploy()

      await expect(
        owner.sendTransaction({
          to: await contract.getAddress(),
          value: 1n,
        }),
      ).to.be.revertedWith('Use pay')
    })
  })

  describe('registerUsername', function () {
    it('registers successfully and emits UsernameRegistered', async function () {
      const { contract, alice } = await deploy()

      await expect(contract.connect(alice).registerUsername('alice'))
        .to.emit(contract, 'UsernameRegistered')
        .withArgs(alice.address, 'alice')

      expect(await contract.usernameToAddress('alice')).to.equal(alice.address)
      expect(await contract.addressToUsername(alice.address)).to.equal('alice')
    })

    it('reverts on duplicate username', async function () {
      const { contract, alice, bob } = await deploy()
      await contract.connect(alice).registerUsername('alice')

      await expect(
        contract.connect(bob).registerUsername('alice'),
      ).to.be.revertedWith('Taken')
    })

    it('reverts if address is already registered', async function () {
      const { contract, alice } = await deploy()
      await contract.connect(alice).registerUsername('alice')

      await expect(
        contract.connect(alice).registerUsername('alice2'),
      ).to.be.revertedWith('Already registered')
    })

    it('rejects username shorter than 3 chars', async function () {
      const { contract, alice } = await deploy()

      await expect(
        contract.connect(alice).registerUsername('ab'),
      ).to.be.revertedWith('Min 3 chars')
    })

    it('rejects uppercase usernames', async function () {
      const { contract, alice } = await deploy()

      await expect(
        contract.connect(alice).registerUsername('Alice'),
      ).to.be.revertedWith('Invalid username')
    })

    it('rejects usernames with spaces', async function () {
      const { contract, alice } = await deploy()

      await expect(
        contract.connect(alice).registerUsername('alice bob'),
      ).to.be.revertedWith('Invalid username')
    })

    it('rejects usernames with unicode characters', async function () {
      const { contract, alice } = await deploy()

      await expect(
        contract.connect(alice).registerUsername('алиса'),
      ).to.be.revertedWith('Invalid username')
    })
  })

  describe('changeUsername', function () {
    it('changes username, frees old slug, emits UsernameChanged', async function () {
      const { contract, alice } = await deploy()
      await contract.connect(alice).registerUsername('alice')

      await expect(contract.connect(alice).changeUsername('alice2'))
        .to.emit(contract, 'UsernameChanged')
        .withArgs(alice.address, 'alice', 'alice2')
        .and.to.emit(contract, 'UsernameRegistered')
        .withArgs(alice.address, 'alice2')

      expect(await contract.addressToUsername(alice.address)).to.equal('alice2')
      expect(await contract.usernameToAddress('alice2')).to.equal(alice.address)
      expect(await contract.usernameToAddress('alice')).to.equal(ethers.ZeroAddress)
    })

    it('allows another user to claim the freed old username', async function () {
      const { contract, alice, bob } = await deploy()
      await contract.connect(alice).registerUsername('alice')
      await contract.connect(alice).changeUsername('alice2')

      await expect(contract.connect(bob).registerUsername('alice'))
        .to.emit(contract, 'UsernameRegistered')
        .withArgs(bob.address, 'alice')
    })

    it('works without prior username (first-time set via changeUsername)', async function () {
      const { contract, alice } = await deploy()

      await expect(contract.connect(alice).changeUsername('alice'))
        .to.emit(contract, 'UsernameRegistered')
        .withArgs(alice.address, 'alice')
    })

    it('reverts if new username is already taken', async function () {
      const { contract, alice, bob } = await deploy()
      await contract.connect(alice).registerUsername('alice')
      await contract.connect(bob).registerUsername('bob')

      await expect(
        contract.connect(alice).changeUsername('bob'),
      ).to.be.revertedWith('Taken')
    })

    it('rejects invalid new username', async function () {
      const { contract, alice } = await deploy()
      await contract.connect(alice).registerUsername('alice')

      await expect(
        contract.connect(alice).changeUsername('AB'),
      ).to.be.revertedWith('Min 3 chars')
    })
  })
})
