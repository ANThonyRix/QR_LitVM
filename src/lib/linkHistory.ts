export type LinkHistoryKind = 'created' | 'received'

export type LinkHistoryEntry = {
  id: `0x${string}`
  url: string
  label: string
  amount: string
  createdAt: number
  updatedAt: number
}

const HISTORY_STORAGE_KEYS: Record<LinkHistoryKind, string> = {
  created: 'qrlitvm_created_history',
  received: 'qrlitvm_received_history',
}

export const HISTORY_UPDATED_EVENT = 'qrlitvm-history-updated'

function getStorageKey(kind: LinkHistoryKind) {
  return HISTORY_STORAGE_KEYS[kind]
}

export function readLinkHistory(kind: LinkHistoryKind): LinkHistoryEntry[] {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const raw = window.localStorage.getItem(getStorageKey(kind))
    const parsed = raw ? (JSON.parse(raw) as LinkHistoryEntry[]) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function upsertLinkHistory(
  kind: LinkHistoryKind,
  entry: Omit<LinkHistoryEntry, 'updatedAt'>,
) {
  if (typeof window === 'undefined') {
    return
  }

  const nextEntry: LinkHistoryEntry = {
    ...entry,
    updatedAt: Date.now(),
  }

  const current = readLinkHistory(kind)
  const deduped = current.filter(item => item.id !== nextEntry.id)
  const next = [nextEntry, ...deduped].slice(0, 50)

  window.localStorage.setItem(getStorageKey(kind), JSON.stringify(next))
  window.dispatchEvent(
    new CustomEvent(HISTORY_UPDATED_EVENT, {
      detail: { kind },
    }),
  )
}

export function clearLinkHistory(kind: LinkHistoryKind) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(getStorageKey(kind))
  window.dispatchEvent(
    new CustomEvent(HISTORY_UPDATED_EVENT, {
      detail: { kind },
    }),
  )
}
