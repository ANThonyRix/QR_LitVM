import { expect } from 'chai'
import { network } from 'hardhat'

const { ethers } = await network.create()

describe('PaymentRequest', function () {
  async function deploy() {
    const [owner, alice, bob] = await ethers.getSigners()
    const contract = await ethers.deployContract('PaymentRequest')
    return { contract, owner, alice, bob }
  }

  // ─── createRequest ────────────────────────────────────────────────────────
  describe('createRequest', function () {
    it('emits RequestCreated with correct args', async function () {
      const { contract, owner } = await deploy()
      const amount = ethers.parseEther('1')
      const label = 'invoice #1'

      await expect(contract.createRequest(amount, label))
        .to.emit(contract, 'RequestCreated')
        .withArgs(
          // id is bytes32 — match any non-zero value via a predicate
          (id: string) => id !== ethers.ZeroHash,
          owner.address,
          amount,
          label,
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
        )
    })
  })

  // ─── pay ──────────────────────────────────────────────────────────────────
  describe('pay', function () {
    async function createFixedRequest(amount: bigint) {
      const { contract, owner, alice, bob } = await deploy()
      const tx = await contract.createRequest(amount, 'test')
      const receipt = await tx.wait()
      // parse the id from the emitted event
      const iface = contract.interface
      let requestId: string | undefined
      for (const log of receipt!.logs) {
        try {
          const parsed = iface.parseLog(log)
          if (parsed && parsed.name === 'RequestCreated') {
            requestId = parsed.args[0]
            break
          }
        } catch {
          // skip non-matching logs
        }
      }
      if (!requestId) throw new Error('RequestCreated event not found')
      return { contract, owner, alice, bob, requestId }
    }

    it('pays exact amount and marks request as paid', async function () {
      const amount = ethers.parseEther('0.5')
      const { contract, alice, requestId } = await createFixedRequest(amount)

      await expect(
        contract.connect(alice).pay(requestId, { value: amount }),
      )
        .to.emit(contract, 'RequestPaid')
        .withArgs(requestId, alice.address, amount)

      const req = await contract.requests(requestId)
      expect(req.paid).to.equal(true)
      expect(req.payer).to.equal(alice.address)
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
      const { contract, alice } = await deploy()
      const tx = await contract.createRequest(0n, 'open')
      const receipt = await tx.wait()
      const iface = contract.interface
      let requestId: string | undefined
      for (const log of receipt!.logs) {
        try {
          const parsed = iface.parseLog(log)
          if (parsed && parsed.name === 'RequestCreated') {
            requestId = parsed.args[0]
            break
          }
        } catch {
          // skip
        }
      }
      if (!requestId) throw new Error('RequestCreated event not found')

      const anyAmount = ethers.parseEther('0.42')
      await expect(
        contract.connect(alice).pay(requestId, { value: anyAmount }),
      )
        .to.emit(contract, 'RequestPaid')
        .withArgs(requestId, alice.address, anyAmount)
    })
  })

  // ─── registerUsername ─────────────────────────────────────────────────────
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
  })
})
