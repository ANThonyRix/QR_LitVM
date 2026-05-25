export type TokenConfig = {
  symbol: string
  name: string
  address: `0x${string}` | null // null = native zkLTC
  decimals: number
}

export const USDC_ADDRESS = '0xd5118dEe968d1533B2A57aB66C266010AD8957fa' as const

export const TOKENS: TokenConfig[] = [
  { symbol: 'zkLTC', name: 'zkLTC (native)', address: null, decimals: 18 },
  { symbol: 'USDC', name: 'USDC', address: USDC_ADDRESS, decimals: 6 },
]

export const ZERO_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000' as `0x${string}`

export function getTokenByAddress(address: `0x${string}` | null): TokenConfig {
  if (!address || address === ZERO_TOKEN_ADDRESS) {
    return TOKENS[0]
  }
  return TOKENS.find(t => t.address?.toLowerCase() === address.toLowerCase()) ?? TOKENS[0]
}

export function isNativeToken(address: `0x${string}` | null | undefined): boolean {
  return !address || address === ZERO_TOKEN_ADDRESS
}
