'use client'

import { useLitvmRpcRecovery } from '@/hooks/useLitvmRpcRecovery'

interface WalletRpcRecoveryNoticeProps {
  error: unknown
}

export function WalletRpcRecoveryNotice({ error }: WalletRpcRecoveryNoticeProps) {
  const {
    shouldShowRecoveryNotice,
    isRecovering,
    isRecovered,
    recoveryFailed,
    recoveryMessage,
    recoverWalletRpc,
  } = useLitvmRpcRecovery(error)

  if (!shouldShowRecoveryNotice) {
    return null
  }

  const palette = isRecovered
    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
    : recoveryFailed
      ? 'border-amber-500/20 bg-amber-500/10 text-amber-200'
      : 'border-blue-500/20 bg-blue-500/10 text-blue-200'

  return (
    <div className={`space-y-3 rounded-xl border px-3 py-3 text-sm ${palette}`}>
      <p>{recoveryMessage}</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void recoverWalletRpc()}
          disabled={isRecovering}
          className="rounded-lg border border-current/20 px-3 py-1.5 text-xs font-semibold text-current transition-all hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRecovering ? 'Updating wallet RPC...' : 'Update wallet RPC'}
        </button>
        {isRecovered && (
          <span className="self-center text-xs text-current/80">
            Retry the wallet action after the network update.
          </span>
        )}
      </div>
    </div>
  )
}
