# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev       # Start dev server at localhost:3000
npm run build     # Production build
npm run lint      # ESLint check
npx hardhat test  # Run smart contract tests (Hardhat + Mocha)
npx hardhat run scripts/deploy.ts --network litvm  # Deploy contract to LitVM testnet
```

## Architecture

**QR LitVM** is a Web3 payment link generator for the LitVM testnet (Liteforge). Users connect a wallet, create on-chain payment requests (with optional fixed amount), and share QR codes or links. No backend — all state lives on-chain or in `localStorage`.

### Routing

| Route | Purpose |
|---|---|
| `/` | Home: generate payment links, register username |
| `/pay/[requestId]` | Payment page — displays request details and pay button |
| `/u/[username]` | Username profile page (on-chain registry) |
| `/widget/[requestId]` | Minimal embed page for iframe embedding |

### Contract Version System

`src/lib/contract.ts` selects the ABI based on `NEXT_PUBLIC_CONTRACT_VERSION` env var (v1/v3/v4). Each version adds features:
- **v3**: reusable links, extended tracking
- **v4**: adds `recipient` field for "pay on behalf of"

ABIs live as `src/lib/PaymentRequest.v*.abi.ts`. Always check the active version before modifying contract interaction code.

### Web3 Stack

- **wagmi** hooks are the primary contract interface — `useReadContract` / `useWriteContract`
- **viem** handles encoding/decoding (use `parseEther` / `formatEther` for zkLTC amounts)
- **RainbowKit** manages wallet connection UI
- RPC failover is configured in `src/lib/wagmi.ts` using wagmi's `fallback()` transport. The hook `src/hooks/useLitvmRpcRecovery.ts` handles runtime RPC switching on bandwidth errors

### Data Flow

1. `useCreateRequest` → writes to contract → extracts `requestId` from `RequestCreated` event log topics
2. `usePaymentRequest` → reads `requests(id)` mapping from contract
3. `usePay` → calls `pay(id)` with `msg.value`
4. Payment history is also saved to `localStorage` (key: `qrlitvm_history`) for the link history UI

### Widget Embedding

`/widget/*` routes have `X-Frame-Options: ALLOWALL` set in `next.config.ts` headers. The widget page is intentionally minimal (no site header).

## Environment Variables

```env
LITVM_RPC_URL=                          # Server-side RPC (Hardhat deploy)
NEXT_PUBLIC_LITVM_RPC_URL=              # Primary RPC
NEXT_PUBLIC_LITVM_RPC_FALLBACK_URL=     # Fallback RPC
NEXT_PUBLIC_LITVM_CHAIN_ID=4441
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_CONTRACT_VERSION=v3         # or v4
NEXT_PUBLIC_CONTRACT_DEPLOYMENT_BLOCK=  # For log queries
DEPLOYER_PRIVATE_KEY=                   # Hardhat deploy only
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=   # Optional: WalletConnect modal
NEXT_PUBLIC_APP_URL=                    # Optional: RainbowKit app URL
```
