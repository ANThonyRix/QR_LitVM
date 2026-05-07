'use client'

import { useEffect, useRef, useState } from 'react'
import {
  getErrorMessage,
  isBandwidthLimitError,
  LITVM_BACKUP_RPC_URL,
  updateLitvmNetworkInWallet,
} from '@/lib/litvmNetwork'

type RecoveryStatus = 'idle' | 'repairing' | 'ready' | 'failed'

function getRecoveryKey(error: unknown) {
  const message = getErrorMessage(error).trim()
  return message || null
}

export function useLitvmRpcRecovery(error: unknown) {
  const [status, setStatus] = useState<RecoveryStatus>('idle')
  const [statusMessage, setStatusMessage] = useState('')
  const attemptKeyRef = useRef<string | null>(null)

  const recoverWalletRpc = async () => {
    setStatus('repairing')
    setStatusMessage('Updating your wallet to the backup LitVM RPC...')

    try {
      const rpcUrl = await updateLitvmNetworkInWallet('backup')
      setStatus('ready')
      setStatusMessage(`Wallet RPC updated to ${rpcUrl}. Please try again.`)
    } catch (recoveryError) {
      const recoveryMessage = getErrorMessage(recoveryError) || 'Unable to update the wallet RPC automatically.'
      setStatus('failed')
      setStatusMessage(recoveryMessage)
    }
  }

  useEffect(() => {
    if (!isBandwidthLimitError(error)) {
      return
    }

    const recoveryKey = getRecoveryKey(error)
    if (!recoveryKey || attemptKeyRef.current === recoveryKey) {
      return
    }

    attemptKeyRef.current = recoveryKey
    void recoverWalletRpc()
  }, [error])

  return {
    shouldShowRecoveryNotice: isBandwidthLimitError(error) || status !== 'idle',
    isRecovering: status === 'repairing',
    isRecovered: status === 'ready',
    recoveryFailed: status === 'failed',
    recoveryMessage:
      statusMessage ||
      `The default LitVM RPC is overloaded. Switching your wallet to ${LITVM_BACKUP_RPC_URL}.`,
    recoverWalletRpc,
  }
}
