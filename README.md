<div align="center">

# Pay LitVM

### Create crypto payment links & QR codes on LitVM — accept zkLTC and USDC with no backend, no intermediaries, and no custody.

[![Live App](https://img.shields.io/badge/Live%20App-pay--litvm.xyz-3b82f6?style=for-the-badge)](https://www.pay-litvm.xyz)
[![Network](https://img.shields.io/badge/Network-LitVM%20Liteforge-6366f1?style=for-the-badge)](https://liteforge.explorer.caldera.xyz)
[![Built with](https://img.shields.io/badge/Built%20with-Next.js%2016-000?style=for-the-badge&logo=next.js)](https://nextjs.org)

</div>

---

## One-sentence description

**Pay LitVM is a fully on-chain payment-link and QR-code generator for the LitVM testnet that lets anyone request and receive zkLTC or USDC payments — through shareable links, embeddable widgets, or human-readable usernames.**

---

## 🔗 Hackathon Links

| Item | Link |
|---|---|
| **Live app** | https://www.pay-litvm.xyz |
| **GitHub repo** | https://github.com/ANThonyRix/QR_LitVM |
| **Network** | LitVM Liteforge Testnet (chain ID `4441`) |
| **Smart contract** | [`0x989a63a5b90F30da9f4e260243Db76b65C80CCd4`](https://liteforge.explorer.caldera.xyz/address/0x989a63a5b90F30da9f4e260243Db76b65C80CCd4) |
| **Block explorer** | https://liteforge.explorer.caldera.xyz |

---

## 💡 The Problem

Receiving crypto on a new chain is clumsy. You either:

- copy-paste a raw `0x…` address (error-prone and unfriendly),
- rely on a centralized payment processor (custody + fees + KYC), or
- ask the payer to manually figure out the amount and token.

There is no simple, **self-custodial** way to say *"pay me 10 USDC for this invoice"* and hand someone a link or QR code that just works.

## ✅ The Solution

Pay LitVM turns any wallet into a payment terminal in seconds. Connect your wallet, set an amount and a label, and you instantly get:

- a **shareable payment link** (`/pay/[id]`),
- a **QR code** for in-person or mobile payments,
- an **embeddable widget** for your website or store, and
- an optional **`@username`** so people can pay you at `pay-litvm.xyz/u/yourname`.

Everything is recorded **on-chain** through a single smart contract. There is **no backend and no database** — state lives entirely on LitVM and in the browser's `localStorage`.

---

## ✨ Features

### 💳 Multi-token payments
Accept **zkLTC** (native gas token) or **USDC** (ERC-20). Fixed-amount requests *or* open "any amount" requests for donations and tips.

### 🔁 One-time & reusable links
One-time links close after the first successful payment. Reusable links stay open forever — perfect for donations, stores, and recurring payments — and track total volume and payment count on-chain.

### 🏷️ On-chain usernames
Register a human-readable `@username` (validated on-chain: 3–32 chars, `a-z 0-9 _`). Anyone can then pay you directly via your profile page at `/u/[username]`.

### 🧩 Embeddable widgets
Drop a "Pay" button on **any** website (HTML, WordPress, Tilda, Wix, React) with a copy-paste snippet. Two widget modes:
- **Single-request widget** (`/widget/[requestId]`) — tied to one prepared request.
- **Multi-token widget** (`/widget/pay/[address]`) — lets the payer choose zkLTC *or* USDC against a fixed or open amount, creating and paying the request in one flow.

Widgets auto-resize inside their iframe via `postMessage` and can be embedded from any origin (including local `file://` pages).

### 📲 QR codes
Every link comes with a styled, downloadable QR code for in-person payments.

### 🛟 Robust payouts & fund recovery
The v6 contract pays recipients directly, but if a transfer fails (e.g. a contract recipient that rejects funds) the proceeds are **queued for withdrawal** instead of being lost. An optional **rescue address** with a 30-day timeout protects against permanently stuck funds. Accidentally-sent native tokens or ERC-20s can be recovered by the owner — *without ever touching balances owed to users*.

### 📜 On-chain history
The home page reads `RequestCreated` and `RequestPaid` event logs straight from the chain to show your **Created / Paid / Received** activity — no indexer required.

### 🌐 RPC failover
Built-in primary + fallback RPC transports with automatic runtime recovery when an endpoint hits bandwidth limits, so payments don't fail on a flaky node.

---

## 🏗️ How It Works

```
┌──────────────┐    create request     ┌────────────────────────┐
│   Merchant   │ ────────────────────► │   PaymentRequest v6     │
│  (any wallet)│                        │   smart contract        │
└──────────────┘                        │   on LitVM Liteforge    │
       │  shares link / QR / widget     └────────────────────────┘
       ▼                                        ▲
┌──────────────┐    pay(id) / payWithToken(id)  │
│    Payer     │ ───────────────────────────────┘
│  (any wallet)│    zkLTC (native) or USDC (ERC-20)
└──────────────┘
```

1. **`useCreateRequest`** writes a request to the contract and extracts the `requestId` from the `RequestCreated` event topics.
2. **`usePaymentRequest`** reads the `requests(id)` mapping to render the payment page.
3. **`usePay`** calls `pay(id)` with `msg.value` for native zkLTC, or `approve` + `payWithToken(id, amount)` for USDC.
4. **`useDirectPayment`** powers username and multi-token-widget flows by creating *and* paying a request in a single user journey.

A configurable protocol fee (capped at 5%) is deducted from the recipient's share and routed to a fee recipient — fully transparent and emitted as a `FeeCollected` event.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router, React 19, Turbopack) |
| **Smart contracts** | Solidity `^0.8.20`, Hardhat 3 |
| **Web3** | wagmi v2 + viem v2 |
| **Wallets** | RainbowKit (MetaMask, Coinbase Wallet, injected) |
| **Styling** | Tailwind CSS v4, shadcn/ui |
| **QR** | qr-code-styling |
| **Hosting** | Vercel |
| **Chain** | LitVM Liteforge Testnet (Caldera) |

---

## 📂 Project Structure

```
contracts/
  PaymentRequestV6.sol      # Main contract: multi-token, reusable links,
                            # usernames, queued payouts, fund recovery
src/
  app/
    page.tsx                # Home — create links, register username, history
    pay/[requestId]/        # Payment page (link target)
    u/[username]/           # Username profile + direct pay
    widget/[requestId]/     # Single-request embeddable widget
    widget/pay/[address]/   # Multi-token embeddable widget
  components/               # PaymentGenerator, PayButton, EmbedCode, QR, …
  hooks/                    # useCreateRequest, usePay, useDirectPayment, …
  lib/
    contract.ts             # Version-aware ABI/address selection
    tokens.ts               # zkLTC + USDC config
    wagmi.ts                # Chains, connectors, RPC failover
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- A wallet with LitVM Liteforge testnet zkLTC ([explorer](https://liteforge.explorer.caldera.xyz))

### Install & run

```bash
git clone https://github.com/ANThonyRix/QR_LitVM.git
cd QR_LitVM
npm install
cp .env.example .env.local   # then fill in the values below
npm run dev                  # http://localhost:3000
```

### Environment variables

```env
# RPC
LITVM_RPC_URL=https://liteforge.rpc.caldera.xyz/http
NEXT_PUBLIC_LITVM_RPC_URL=https://liteforge.rpc.caldera.xyz/http
NEXT_PUBLIC_LITVM_RPC_FALLBACK_URL=https://liteforge.rpc.caldera.xyz/http
NEXT_PUBLIC_LITVM_CHAIN_ID=4441

# Contract
NEXT_PUBLIC_CONTRACT_ADDRESS=0x989a63a5b90F30da9f4e260243Db76b65C80CCd4
NEXT_PUBLIC_CONTRACT_VERSION=v6
NEXT_PUBLIC_CONTRACT_DEPLOYMENT_BLOCK=13595499

# Optional
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
NEXT_PUBLIC_APP_URL=https://www.pay-litvm.xyz

# Hardhat deploy only
DEPLOYER_PRIVATE_KEY=
```

### Useful commands

```bash
npm run dev       # Dev server
npm run build     # Production build
npm run lint      # ESLint
npx hardhat test  # Contract tests
npx hardhat run scripts/deploy.ts --network litvm   # Deploy contract
```

---

## 🔐 Security Notes

- **Self-custodial** — funds move directly from payer to recipient; the app never holds keys or balances.
- **Reentrancy-guarded** payment and withdrawal functions, checks-effects-interactions ordering.
- **On-chain input validation** for usernames and labels.
- **Front-end validation** of request IDs (`bytes32`) and payment amounts.
- **Stuck-fund recovery** subtracts `totalPendingWithdrawals` so the owner can never withdraw user-owed funds.
- Security headers (HSTS, `X-Frame-Options`, `X-Content-Type-Options`) on all non-widget routes.

---

## 📄 License

MIT

<div align="center">

**Built for the [LitVM Hackathon](https://hackathon.litvm.com) 🏆**

</div>
