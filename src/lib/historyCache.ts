import { CONTRACT_ADDRESS } from './contract'

type HistoryKind = 'created' | 'paid'

type RememberedRequestIds = Record<HistoryKind, `0x${string}`[]>

const STORAGE_PREFIX = 'qrlitvm_history_ids'
const REQUEST_ID_PATTERN = /^0x[0-9a-fA-F]{64}$/

function storageKey(wallet: `0x${string}`) {
  return `${STORAGE_PREFIX}:${CONTRACT_ADDRESS.toLowerCase()}:${wallet.toLowerCase()}`
}

function toRequestIds(value: unknown): `0x${string}`[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter(
    (item): item is `0x${string}` => typeof item === 'string' && REQUEST_ID_PATTERN.test(item),
  )
}

export function getRememberedRequestIds(wallet: `0x${string}`): RememberedRequestIds {
  try {
    const raw = window.localStorage.getItem(storageKey(wallet))
    const parsed = raw ? (JSON.parse(raw) as Partial<Record<HistoryKind, unknown>>) : {}
    return { created: toRequestIds(parsed.created), paid: toRequestIds(parsed.paid) }
  } catch {
    return { created: [], paid: [] }
  }
}

export function rememberRequestId(wallet: `0x${string}`, kind: HistoryKind, id: `0x${string}`) {
  try {
    const current = getRememberedRequestIds(wallet)
    if (current[kind].includes(id)) {
      return
    }

    window.localStorage.setItem(
      storageKey(wallet),
      JSON.stringify({ ...current, [kind]: [...current[kind], id] }),
    )
  } catch {
    return
  }
}
