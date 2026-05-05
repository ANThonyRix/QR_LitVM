'use client'
import { ConnectButton } from '@rainbow-me/rainbowkit'

export function WalletConnect() {
  return (
    <ConnectButton
      showBalance={{ smallScreen: false, largeScreen: true }}
      chainStatus="icon"
    />
  )
}
