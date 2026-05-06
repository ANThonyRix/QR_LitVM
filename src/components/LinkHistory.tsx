'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  clearLinkHistory,
  HISTORY_UPDATED_EVENT,
  type LinkHistoryEntry,
  type LinkHistoryKind,
  readLinkHistory,
} from '@/lib/linkHistory'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const glassCard = {
  background: 'oklch(0.13 0.03 264 / 0.8)',
  border: '1px solid oklch(1 0 0 / 8%)',
  backdropFilter: 'blur(20px)',
  borderRadius: '16px',
} as React.CSSProperties

const copyButtonStyle = {
  background: 'oklch(1 0 0 / 4%)',
  border: '1px solid oklch(1 0 0 / 8%)',
} as React.CSSProperties

const labels: Record<LinkHistoryKind, { title: string; empty: string; hint: string }> = {
  created: {
    title: 'Created links',
    empty: 'Your generated payment links will appear here.',
    hint: 'Saved on this device after successful creation.',
  },
  received: {
    title: 'Received links',
    empty: 'Links you open to pay will appear here.',
    hint: 'Saved locally when you open a payment page.',
  },
}

function formatTimestamp(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(timestamp)
}

function HistoryList({
  kind,
  entries,
}: {
  kind: LinkHistoryKind
  entries: LinkHistoryEntry[]
}) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const copyLink = async (url: string, id: string) => {
    await navigator.clipboard.writeText(url)
    setCopiedId(id)
    window.setTimeout(() => setCopiedId(current => (current === id ? null : current)), 1500)
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center">
        <p className="text-sm text-white/65">{labels[kind].empty}</p>
        <p className="mt-2 text-xs text-white/35">{labels[kind].hint}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {entries.map(entry => (
        <div
          key={`${kind}-${entry.id}`}
          className="rounded-2xl border border-white/8 p-4"
          style={{ background: 'oklch(1 0 0 / 3%)' }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{entry.label}</p>
              <p className="mt-1 text-xs text-white/45">
                {entry.amount || 'Any amount'} zkLTC
              </p>
            </div>
            <span className="shrink-0 rounded-full border border-white/8 px-2 py-1 text-[11px] text-white/45">
              {kind === 'created' ? 'Created' : 'Opened'}
            </span>
          </div>

          <a
            href={entry.url}
            className="mt-3 block break-all rounded-xl border border-white/8 px-3 py-2 text-xs font-mono text-blue-300 transition-colors hover:text-blue-200"
            style={{ background: 'oklch(0.62 0.19 261 / 0.08)' }}
          >
            {entry.url}
          </a>

          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-[11px] text-white/35">
              {formatTimestamp(entry.updatedAt)}
            </p>
            <div className="flex items-center gap-2">
              <a
                href={entry.url}
                className="rounded-xl px-3 py-2 text-xs font-medium text-white/75 transition-colors hover:text-white"
                style={copyButtonStyle}
              >
                Open
              </a>
              <button
                className="rounded-xl px-3 py-2 text-xs font-medium text-white/75 transition-colors hover:text-white"
                style={copyButtonStyle}
                onClick={() => copyLink(entry.url, entry.id)}
              >
                {copiedId === entry.id ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function LinkHistory() {
  const [createdEntries, setCreatedEntries] = useState<LinkHistoryEntry[]>([])
  const [receivedEntries, setReceivedEntries] = useState<LinkHistoryEntry[]>([])

  const reload = () => {
    setCreatedEntries(readLinkHistory('created'))
    setReceivedEntries(readLinkHistory('received'))
  }

  useEffect(() => {
    reload()

    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key.startsWith('qrlitvm_')) {
        reload()
      }
    }

    const handleHistoryUpdate = () => {
      reload()
    }

    window.addEventListener('storage', handleStorage)
    window.addEventListener(HISTORY_UPDATED_EVENT, handleHistoryUpdate)

    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener(HISTORY_UPDATED_EVENT, handleHistoryUpdate)
    }
  }, [])

  const counters = useMemo(
    () => ({
      created: createdEntries.length,
      received: receivedEntries.length,
    }),
    [createdEntries.length, receivedEntries.length],
  )

  return (
    <div style={glassCard} className="p-6 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-white/40">History</p>
          <h2 className="mt-1 text-lg font-semibold text-white">Created and received links</h2>
        </div>
      </div>

      <Tabs defaultValue="created">
        <TabsList className="w-full bg-white/5 border border-white/10">
          <TabsTrigger value="created" className="flex-1 data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60">
            Created ({counters.created})
          </TabsTrigger>
          <TabsTrigger value="received" className="flex-1 data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60">
            Received ({counters.received})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="created" className="space-y-4 pt-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-white/40">{labels.created.hint}</p>
            {createdEntries.length > 0 && (
              <button
                className="text-xs text-white/45 underline underline-offset-4 transition-colors hover:text-white/70"
                onClick={() => clearLinkHistory('created')}
              >
                Clear
              </button>
            )}
          </div>
          <HistoryList kind="created" entries={createdEntries} />
        </TabsContent>

        <TabsContent value="received" className="space-y-4 pt-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-white/40">{labels.received.hint}</p>
            {receivedEntries.length > 0 && (
              <button
                className="text-xs text-white/45 underline underline-offset-4 transition-colors hover:text-white/70"
                onClick={() => clearLinkHistory('received')}
              >
                Clear
              </button>
            )}
          </div>
          <HistoryList kind="received" entries={receivedEntries} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
