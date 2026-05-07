export type LitvmRpcMode = 'default' | 'backup'

export const LITVM_CHAIN_ID = Number(process.env.NEXT_PUBLIC_LITVM_CHAIN_ID ?? '4441')
export const LITVM_NETWORK_NAME = 'LitVM Liteforge Testnet'
export const LITVM_CURRENCY_SYMBOL = 'zkLTC'
export const LITVM_EXPLORER_URL = 'https://liteforge.explorer.caldera.xyz'
export const LITVM_DEFAULT_RPC_URL =
  process.env.NEXT_PUBLIC_LITVM_RPC_URL ?? 'https://liteforge.rpc.caldera.xyz/http'
export const LITVM_BACKUP_RPC_URL =
  process.env.NEXT_PUBLIC_LITVM_RPC_FALLBACK_URL ?? 'https://liteforge.rpc.caldera.xyz/infra-partner-http'

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
}

function getEthereumProvider() {
  if (typeof window === 'undefined') {
    return null
  }

  return (window as Window & { ethereum?: EthereumProvider }).ethereum ?? null
}

export function getLitvmRpcUrl(mode: LitvmRpcMode) {
  return mode === 'backup' ? LITVM_BACKUP_RPC_URL : LITVM_DEFAULT_RPC_URL
}

export function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  return ''
}

export function isBandwidthLimitError(error: unknown) {
  return /bandwidth limit exceeded/i.test(getErrorMessage(error))
}

async function postRpcRequest(url: string, body: Record<string, unknown>) {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 5000)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    const json = await response.json().catch(() => null)
    return { response, json }
  } finally {
    window.clearTimeout(timeout)
  }
}

export async function isLitvmRpcAvailable(url: string) {
  try {
    const { response, json } = await postRpcRequest(url, {
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_chainId',
      params: [],
    })

    if (!response.ok) {
      return false
    }

    const errorMessage =
      typeof json === 'object' && json && 'error' in json
        ? getErrorMessage((json as { error?: unknown }).error)
        : ''

    if (errorMessage && isBandwidthLimitError(errorMessage)) {
      return false
    }

    return Boolean(
      typeof json === 'object' &&
      json &&
      'result' in json &&
      typeof (json as { result?: unknown }).result === 'string',
    )
  } catch {
    return false
  }
}

export async function ensureHealthyLitvmWalletRpc() {
  const defaultRpcAvailable = await isLitvmRpcAvailable(LITVM_DEFAULT_RPC_URL)
  if (defaultRpcAvailable) {
    return 'default' satisfies LitvmRpcMode
  }

  await updateLitvmNetworkInWallet('backup')
  return 'backup' satisfies LitvmRpcMode
}

export async function switchLitvmNetworkInWallet() {
  const ethereum = getEthereumProvider()
  if (!ethereum) {
    throw new Error('Wallet provider not found.')
  }

  await ethereum.request({
    method: 'wallet_switchEthereumChain',
    params: [{ chainId: `0x${LITVM_CHAIN_ID.toString(16)}` }],
  })
}

export async function updateLitvmNetworkInWallet(mode: LitvmRpcMode) {
  const ethereum = getEthereumProvider()
  if (!ethereum) {
    throw new Error('Wallet provider not found.')
  }

  const rpcUrl = getLitvmRpcUrl(mode)

  await ethereum.request({
    method: 'wallet_addEthereumChain',
    params: [
      {
        chainId: `0x${LITVM_CHAIN_ID.toString(16)}`,
        chainName: LITVM_NETWORK_NAME,
        nativeCurrency: {
          name: LITVM_CURRENCY_SYMBOL,
          symbol: LITVM_CURRENCY_SYMBOL,
          decimals: 18,
        },
        rpcUrls: [rpcUrl],
        blockExplorerUrls: [LITVM_EXPLORER_URL],
      },
    ],
  })

  try {
    await switchLitvmNetworkInWallet()
  } catch {
    // Some wallets ignore switching right after updating the network definition.
  }

  return rpcUrl
}
