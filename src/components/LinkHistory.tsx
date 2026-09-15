'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAccount } from 'wagmi'
import { CONTRACT_VERSION } from '@/lib/contract'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ONCHAIN_HISTORY_REFRESH_EVENT,
  type OnchainHistoryEntry,
  useOnchainHistory,
} from '@/hooks/useOnchainHistory'

type HistoryTabKey = 'created' | 'paid' | 'received'

const actionButtonClass = 'rounded-xl border border-white/8 bg-white/[0.04] px-3 py-2 text-xs font-medium text-white/75 transition-colors hover:text-white'

function formatTimestamp(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(timestamp * 1000)
}

function shortenAddress(address: `0x${string}`) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function HistoryList({
  entries,
  emptyText,
  counterpartyLabel,
}: {
  entries: OnchainHistoryEntry[]
  emptyText: string
  counterpartyLabel?: string
}) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const copyLink = async (url: string, id: string) => {
    await navigator.clipboard.writeText(url)
    setCopiedId(id)
    window.setTimeout(() => {
      setCopiedId(current => (current === id ? null : current))
    }, 1500)
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center">
        <p className="text-sm text-white/65">{emptyText}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {entries.map(entry => (
        <div
          key={entry.id}
          className="rounded-2xl border border-white/8 bg-white/[0.03] p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{entry.label}</p>
              <p className="mt-1 font-mono text-xs tabular-nums text-white/45">
                {entry.amountDisplay === 'Any amount' ? entry.amountDisplay : `${entry.amountDisplay} zkLTC`}
              </p>
            </div>
            <span className="shrink-0 rounded-full border border-white/8 px-2 py-1 text-[11px] text-white/45">
              {formatTimestamp(entry.timestamp)}
            </span>
          </div>

          {entry.counterparty && counterpartyLabel && (
            <p className="mt-3 text-xs text-white/45">
              {counterpartyLabel}: <span className="font-mono text-white/65">{shortenAddress(entry.counterparty)}</span>
            </p>
          )}

          <a
            href={entry.url}
            className="mt-3 block break-all rounded-xl border border-primary/20 bg-primary/[0.08] px-3 py-2 text-xs font-mono text-blue-300 transition-colors hover:text-blue-200"
          >
            {entry.url}
          </a>

          <div className="mt-3 flex items-center justify-end gap-2">
            <a href={entry.url} className={actionButtonClass}>
              Open
            </a>
            <button className={actionButtonClass} onClick={() => copyLink(entry.url, entry.id)}>
              {copiedId === entry.id ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

function HistorySection({
  sectionKey,
  title,
  entries,
  emptyText,
  counterpartyLabel,
  expandedSections,
  onToggle,
}: {
  sectionKey: HistoryTabKey
  title: string
  entries: OnchainHistoryEntry[]
  emptyText: string
  counterpartyLabel?: string
  expandedSections: Record<HistoryTabKey, boolean>
  onToggle: (sectionKey: HistoryTabKey) => void
}) {
  const isExpanded = expandedSections[sectionKey]

  return (
    <div className="pt-4 space-y-4">
      <button
        type="button"
        onClick={() => onToggle(sectionKey)}
        className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left transition-all hover:bg-white/8"
      >
        <div>
          <p className="text-sm font-medium text-white">{title}</p>
          <p className="mt-1 text-xs text-white/40">
            {entries.length} {entries.length === 1 ? 'link' : 'links'}
          </p>
        </div>
        <span className="text-sm text-white/60">
          {isExpanded ? 'Hide links' : 'Show links'}
        </span>
      </button>

      {isExpanded && (
        <HistoryList
          entries={entries}
          emptyText={emptyText}
          counterpartyLabel={counterpartyLabel}
        />
      )}
    </div>
  )
}

export function LinkHistory() {
  const { isConnected } = useAccount()
  const [refreshKey, setRefreshKey] = useState(0)
  const [expandedSections, setExpandedSections] = useState<Record<HistoryTabKey, boolean>>({
    created: false,
    paid: false,
    received: false,
  })
  const {
    createdEntries,
    paidEntries,
    receivedEntries,
    isLoading,
    error,
  } = useOnchainHistory(refreshKey)

  useEffect(() => {
    const handleRefresh = () => {
      setRefreshKey(current => current + 1)
    }

    window.addEventListener(ONCHAIN_HISTORY_REFRESH_EVENT, handleRefresh)

    return () => {
      window.removeEventListener(ONCHAIN_HISTORY_REFRESH_EVENT, handleRefresh)
    }
  }, [])

  const counters = useMemo(
    () => ({
      created: createdEntries.length,
      paid: paidEntries.length,
      received: receivedEntries.length,
    }),
    [createdEntries.length, paidEntries.length, receivedEntries.length],
  )

  const toggleSection = (sectionKey: HistoryTabKey) => {
    setExpandedSections(current => ({
      ...current,
      [sectionKey]: !current[sectionKey],
    }))
  }

  return (
    <div className="space-y-5 rounded-2xl border border-border bg-card p-6">
      <div>
        <p className="text-xs uppercase tracking-wide text-white/40">On-chain history</p>
        <h2 className="mt-1 text-lg font-semibold text-white">Your wallet activity</h2>
      </div>

      {!isConnected && (
        <div className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center">
          <p className="text-sm text-white/65">Connect your wallet to load on-chain history.</p>
        </div>
      )}

      {isConnected && (
        <>
          {isLoading && (
            <div className="rounded-2xl border border-white/8 px-4 py-6 text-center text-sm text-white/55">
              Loading on-chain history...
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <Tabs defaultValue="created">
            <TabsList className="w-full bg-white/5 border border-white/10">
              <TabsTrigger value="created" className="flex-1 data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60">
                Created ({counters.created})
              </TabsTrigger>
              <TabsTrigger value="paid" className="flex-1 data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60">
                Paid ({counters.paid})
              </TabsTrigger>
              <TabsTrigger value="received" className="flex-1 data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60">
                Received ({counters.received})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="created">
              <HistorySection
                sectionKey="created"
                title="Created links"
                entries={createdEntries}
                emptyText="No payment links created from this wallet yet."
                counterpartyLabel={
                  CONTRACT_VERSION === 'v4' || CONTRACT_VERSION === 'v5' ? 'Recipient' : undefined
                }
                expandedSections={expandedSections}
                onToggle={toggleSection}
              />
            </TabsContent>

            <TabsContent value="paid">
              <HistorySection
                sectionKey="paid"
                title="Paid links"
                entries={paidEntries}
                emptyText="No outgoing payments from this wallet yet."
                counterpartyLabel="Recipient"
                expandedSections={expandedSections}
                onToggle={toggleSection}
              />
            </TabsContent>

            <TabsContent value="received">
              <HistorySection
                sectionKey="received"
                title="Received links"
                entries={receivedEntries}
                emptyText="No incoming payments to this wallet yet."
                counterpartyLabel="Payer"
                expandedSections={expandedSections}
                onToggle={toggleSection}
              />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
