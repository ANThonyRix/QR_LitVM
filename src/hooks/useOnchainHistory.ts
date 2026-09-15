'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAccount, usePublicClient } from 'wagmi'
import { formatEther, getAbiItem } from 'viem'
import {
  CONTRACT_ADDRESS,
  CONTRACT_DEPLOYMENT_BLOCK,
  CONTRACT_VERSION,
} from '@/lib/contract'
import { PAYMENT_REQUEST_V1_ABI } from '@/lib/PaymentRequestV1.abi'
import { PAYMENT_REQUEST_ABI as PAYMENT_REQUEST_V2_ABI } from '@/lib/PaymentRequest.abi'
import { PAYMENT_REQUEST_V3_ABI } from '@/lib/PaymentRequestV3.abi'
import { PAYMENT_REQUEST_V4_ABI } from '@/lib/PaymentRequestV4.abi'
import { PAYMENT_REQUEST_V5_ABI } from '@/lib/PaymentRequestV5.abi'
import { PAYMENT_REQUEST_V6_ABI } from '@/lib/PaymentRequestV6.abi'

export const ONCHAIN_HISTORY_REFRESH_EVENT = 'qrlitvm-onchain-history-refresh'

export type OnchainHistoryEntry = {
  id: `0x${string}`
  url: string
  label: string
  amount: bigint
  amountDisplay: string
  timestamp: number
  counterparty?: `0x${string}`
}

type UseOnchainHistoryResult = {
  createdEntries: OnchainHistoryEntry[]
  paidEntries: OnchainHistoryEntry[]
  receivedEntries: OnchainHistoryEntry[]
  isLoading: boolean
  error: string | null
}

function toAmountDisplay(amount: bigint) {
  return amount > 0n ? formatEther(amount) : 'Any amount'
}

function toPaymentUrl(id: `0x${string}`) {
  if (typeof window === 'undefined') {
    return `/pay/${id}`
  }

  return `${window.location.origin}/pay/${id}`
}

type V1RequestSnapshot = {
  recipient: `0x${string}`
  amount: bigint
  label: string
  paid: boolean
  payer: `0x${string}`
  paidAt: bigint
}

function normalizeV1RequestSnapshot(rawRequest: readonly unknown[]): V1RequestSnapshot {
  return {
    recipient: rawRequest[0] as `0x${string}`,
    amount: rawRequest[1] as bigint,
    label: rawRequest[2] as string,
    paid: rawRequest[3] as boolean,
    payer: rawRequest[4] as `0x${string}`,
    paidAt: rawRequest[5] as bigint,
  }
}

function getModernHistoryAbi() {
  if (CONTRACT_VERSION === 'v6') {
    return PAYMENT_REQUEST_V6_ABI
  }

  if (CONTRACT_VERSION === 'v5') {
    return PAYMENT_REQUEST_V5_ABI
  }

  if (CONTRACT_VERSION === 'v4') {
    return PAYMENT_REQUEST_V4_ABI
  }

  if (CONTRACT_VERSION === 'v3') {
    return PAYMENT_REQUEST_V3_ABI
  }

  return PAYMENT_REQUEST_V2_ABI
}

const LOG_CHUNK_BLOCKS = 2_000_000n
const MIN_LOG_CHUNK_BLOCKS = 50_000n
const LOG_CHUNK_CONCURRENCY = 4

type PublicClient = NonNullable<ReturnType<typeof usePublicClient>>
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GetLogsParams = any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LogsResult = any[]

async function fetchLogsInRange(
  publicClient: PublicClient,
  params: GetLogsParams,
  fromBlock: bigint,
  toBlock: bigint,
  chunkSize: bigint,
): Promise<LogsResult> {
  try {
    return await publicClient.getLogs({ ...params, fromBlock, toBlock })
  } catch (error) {
    if (chunkSize <= MIN_LOG_CHUNK_BLOCKS || toBlock <= fromBlock) {
      throw error
    }

    const mid = fromBlock + (toBlock - fromBlock) / 2n
    const nextChunkSize = chunkSize / 2n
    const [left, right] = await Promise.all([
      fetchLogsInRange(publicClient, params, fromBlock, mid, nextChunkSize),
      fetchLogsInRange(publicClient, params, mid + 1n, toBlock, nextChunkSize),
    ])
    return [...left, ...right]
  }
}

// RPC providers time out on unbounded eth_getLogs ranges over the deployment
// block's full history, so fetch in windows and shrink on failure.
async function getLogsChunked(
  publicClient: PublicClient,
  params: GetLogsParams,
  fromBlock: bigint,
): Promise<LogsResult> {
  const toBlock = await publicClient.getBlockNumber()

  const ranges: Array<[bigint, bigint]> = []
  let start = fromBlock
  while (start <= toBlock) {
    const end = start + LOG_CHUNK_BLOCKS > toBlock ? toBlock : start + LOG_CHUNK_BLOCKS
    ranges.push([start, end])
    start = end + 1n
  }

  const results: LogsResult = []
  for (let i = 0; i < ranges.length; i += LOG_CHUNK_CONCURRENCY) {
    const batch = ranges.slice(i, i + LOG_CHUNK_CONCURRENCY)
    const batchResults = await Promise.all(
      batch.map(([from, to]) => fetchLogsInRange(publicClient, params, from, to, LOG_CHUNK_BLOCKS)),
    )
    results.push(...batchResults.flat())
  }

  return results
}

async function readV1Requests(publicClient: NonNullable<ReturnType<typeof usePublicClient>>, ids: `0x${string}`[]) {
  const uniqueIds = [...new Set(ids)]

  const results = await Promise.all(
    uniqueIds.map(async id => {
      const rawRequest = (await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: PAYMENT_REQUEST_V1_ABI,
        functionName: 'requests',
        args: [id],
      })) as readonly unknown[]

      return [id, normalizeV1RequestSnapshot(rawRequest)] as const
    }),
  )

  return new Map(results)
}

async function readBlockTimestamps(
  publicClient: NonNullable<ReturnType<typeof usePublicClient>>,
  blockNumbers: bigint[],
) {
  const uniqueBlocks = [...new Set(blockNumbers.map(blockNumber => blockNumber.toString()))].map(
    value => BigInt(value),
  )

  const blocks = await Promise.all(
    uniqueBlocks.map(async blockNumber => {
      const block = await publicClient.getBlock({ blockNumber })
      return [blockNumber.toString(), Number(block.timestamp)] as const
    }),
  )

  return new Map(blocks)
}

export function useOnchainHistory(refreshKey: number): UseOnchainHistoryResult {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()

  const [createdEntries, setCreatedEntries] = useState<OnchainHistoryEntry[]>([])
  const [paidEntries, setPaidEntries] = useState<OnchainHistoryEntry[]>([])
  const [receivedEntries, setReceivedEntries] = useState<OnchainHistoryEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isConnected || !address || !publicClient) {
      setCreatedEntries([])
      setPaidEntries([])
      setReceivedEntries([])
      setIsLoading(false)
      setError(null)
      return
    }

    const client = publicClient
    const walletAddress = address
    let cancelled = false

    async function loadHistory() {
      setIsLoading(true)
      setError(null)

      try {
        const [createdLogs, paidLogs, receivedLogs] = await Promise.all([
          (async () => {
            if (CONTRACT_VERSION === 'v2' || CONTRACT_VERSION === 'v3' || CONTRACT_VERSION === 'v4' || CONTRACT_VERSION === 'v5' || CONTRACT_VERSION === 'v6') {
              const requestCreatedEvent = getAbiItem({
                abi: getModernHistoryAbi(),
                name: 'RequestCreated',
              })

              return getLogsChunked(
                client,
                {
                  address: CONTRACT_ADDRESS,
                  event: requestCreatedEvent,
                  args:
                    CONTRACT_VERSION === 'v4' || CONTRACT_VERSION === 'v5' || CONTRACT_VERSION === 'v6'
                      ? { creator: walletAddress }
                      : { recipient: walletAddress },
                },
                CONTRACT_DEPLOYMENT_BLOCK,
              )
            }

            const requestCreatedEvent = getAbiItem({
              abi: PAYMENT_REQUEST_V1_ABI,
              name: 'RequestCreated',
            })

            return getLogsChunked(
              client,
              {
                address: CONTRACT_ADDRESS,
                event: requestCreatedEvent,
                args: { recipient: walletAddress },
              },
              CONTRACT_DEPLOYMENT_BLOCK,
            )
          })(),
          (async () => {
            if (CONTRACT_VERSION === 'v2' || CONTRACT_VERSION === 'v3' || CONTRACT_VERSION === 'v4' || CONTRACT_VERSION === 'v5' || CONTRACT_VERSION === 'v6') {
              const requestPaidEvent = getAbiItem({
                abi: getModernHistoryAbi(),
                name: 'RequestPaid',
              })

              return getLogsChunked(
                client,
                {
                  address: CONTRACT_ADDRESS,
                  event: requestPaidEvent,
                  args: { payer: walletAddress },
                },
                CONTRACT_DEPLOYMENT_BLOCK,
              )
            }

            const requestPaidEvent = getAbiItem({
              abi: PAYMENT_REQUEST_V1_ABI,
              name: 'RequestPaid',
            })

            return getLogsChunked(
              client,
              {
                address: CONTRACT_ADDRESS,
                event: requestPaidEvent,
                args: { payer: walletAddress },
              },
              CONTRACT_DEPLOYMENT_BLOCK,
            )
          })(),
          (async () => {
            if (CONTRACT_VERSION === 'v2' || CONTRACT_VERSION === 'v3' || CONTRACT_VERSION === 'v4' || CONTRACT_VERSION === 'v5' || CONTRACT_VERSION === 'v6') {
              const requestPaidEvent = getAbiItem({
                abi: getModernHistoryAbi(),
                name: 'RequestPaid',
              })

              return getLogsChunked(
                client,
                {
                  address: CONTRACT_ADDRESS,
                  event: requestPaidEvent,
                  args: { recipient: walletAddress },
                },
                CONTRACT_DEPLOYMENT_BLOCK,
              )
            }

            const requestPaidEvent = getAbiItem({
              abi: PAYMENT_REQUEST_V1_ABI,
              name: 'RequestPaid',
            })

            return getLogsChunked(
              client,
              {
                address: CONTRACT_ADDRESS,
                event: requestPaidEvent,
              },
              CONTRACT_DEPLOYMENT_BLOCK,
            )
          })(),
        ])

        if (cancelled) {
          return
        }

        if (CONTRACT_VERSION === 'v2' || CONTRACT_VERSION === 'v3' || CONTRACT_VERSION === 'v4' || CONTRACT_VERSION === 'v5' || CONTRACT_VERSION === 'v6') {
          const createdLogsV2 = createdLogs as Array<{
            args: {
              id?: `0x${string}`
              recipient?: `0x${string}`
              amount?: bigint
              label?: string
              createdAt?: bigint
            }
          }>
          const paidLogsV2 = paidLogs as Array<{
            args: {
              id?: `0x${string}`
              recipient?: `0x${string}`
              amount?: bigint
              label?: string
              paidAt?: bigint
            }
          }>
          const receivedLogsV2 = receivedLogs as Array<{
            args: {
              id?: `0x${string}`
              payer?: `0x${string}`
              amount?: bigint
              label?: string
              paidAt?: bigint
            }
          }>

          const nextCreatedEntries = (createdLogsV2
            .map(log => {
              const { id, amount, label, createdAt } = log.args
              if (!id || amount === undefined || !label || createdAt === undefined) {
                return null
              }

              return {
                id,
                url: toPaymentUrl(id),
                label,
                amount,
                amountDisplay: toAmountDisplay(amount),
                timestamp: Number(createdAt),
                counterparty:
                  CONTRACT_VERSION === 'v4' || CONTRACT_VERSION === 'v5' || CONTRACT_VERSION === 'v6'
                    ? (log.args.recipient as `0x${string}` | undefined)
                    : undefined,
              }
            })
            .filter(Boolean) as OnchainHistoryEntry[])
          nextCreatedEntries.sort((a, b) => b.timestamp - a.timestamp)

          const nextPaidEntries = (paidLogsV2
            .map(log => {
              const { id, recipient, amount, label, paidAt } = log.args
              if (!id || !recipient || amount === undefined || !label || paidAt === undefined) {
                return null
              }

              return {
                id,
                url: toPaymentUrl(id),
                label,
                amount,
                amountDisplay: toAmountDisplay(amount),
                timestamp: Number(paidAt),
                counterparty: recipient,
              }
            })
            .filter(Boolean) as OnchainHistoryEntry[])
          nextPaidEntries.sort((a, b) => b.timestamp - a.timestamp)

          const nextReceivedEntries = (receivedLogsV2
            .map(log => {
              const { id, payer, amount, label, paidAt } = log.args
              if (!id || !payer || amount === undefined || !label || paidAt === undefined) {
                return null
              }

              return {
                id,
                url: toPaymentUrl(id),
                label,
                amount,
                amountDisplay: toAmountDisplay(amount),
                timestamp: Number(paidAt),
                counterparty: payer,
              }
            })
            .filter(Boolean) as OnchainHistoryEntry[])
          nextReceivedEntries.sort((a, b) => b.timestamp - a.timestamp)

          setCreatedEntries(nextCreatedEntries)
          setPaidEntries(nextPaidEntries)
          setReceivedEntries(nextReceivedEntries)

          return
        }

        const createdIds = createdLogs
          .map(log => log.args.id)
          .filter((id): id is `0x${string}` => Boolean(id))
        const paidIds = paidLogs
          .map(log => log.args.id)
          .filter((id): id is `0x${string}` => Boolean(id))
        const allRelevantIds = [...createdIds, ...paidIds]

        const [requestSnapshots, blockTimestamps] = await Promise.all([
          readV1Requests(client, allRelevantIds),
          readBlockTimestamps(
            client,
            [...createdLogs, ...paidLogs]
              .map(log => log.blockNumber)
              .filter((blockNumber): blockNumber is bigint => blockNumber !== null),
          ),
        ])

        if (cancelled) {
          return
        }

        const receivedPaidLogsById = new Map(
          receivedLogs
            .map(log => {
              const id = log.args.id
              if (!id || !createdIds.includes(id)) {
                return null
              }

              return [id, log] as const
            })
            .filter((entry): entry is readonly [`0x${string}`, (typeof receivedLogs)[number]] => entry !== null),
        )

        const nextCreatedEntries = (createdLogs
          .map(log => {
            const { id, amount, label } = log.args
            if (!id || amount === undefined || !label || log.blockNumber === null) {
              return null
            }

            return {
              id,
              url: toPaymentUrl(id),
              label,
              amount,
              amountDisplay: toAmountDisplay(amount),
              timestamp: blockTimestamps.get(log.blockNumber.toString()) ?? 0,
            }
          })
          .filter(Boolean) as OnchainHistoryEntry[])
        nextCreatedEntries.sort((a, b) => b.timestamp - a.timestamp)

        const nextPaidEntries = (paidLogs
          .map(log => {
            const { id, amount } = log.args
            if (!id || amount === undefined || log.blockNumber === null) {
              return null
            }

            const requestSnapshot = requestSnapshots.get(id)
            if (!requestSnapshot) {
              return null
            }

            return {
              id,
              url: toPaymentUrl(id),
              label: requestSnapshot.label,
              amount,
              amountDisplay: toAmountDisplay(amount),
              timestamp: blockTimestamps.get(log.blockNumber.toString()) ?? 0,
              counterparty: requestSnapshot.recipient,
            }
          })
          .filter(Boolean) as OnchainHistoryEntry[])
        nextPaidEntries.sort((a, b) => b.timestamp - a.timestamp)

        const nextReceivedEntries = (createdIds
          .map(id => {
            const requestSnapshot = requestSnapshots.get(id)
            const paidLog = receivedPaidLogsById.get(id)

            if (!requestSnapshot || !requestSnapshot.paid || !paidLog) {
              return null
            }

            const amount = paidLog.args.amount
            if (amount === undefined) {
              return null
            }

            return {
              id,
              url: toPaymentUrl(id),
              label: requestSnapshot.label,
              amount,
              amountDisplay: toAmountDisplay(amount),
              timestamp: Number(requestSnapshot.paidAt),
              counterparty: requestSnapshot.payer,
            }
          })
          .filter(Boolean) as OnchainHistoryEntry[])
        nextReceivedEntries.sort((a, b) => b.timestamp - a.timestamp)

        setCreatedEntries(nextCreatedEntries)
        setPaidEntries(nextPaidEntries)
        setReceivedEntries(nextReceivedEntries)
      } catch (caughtError) {
        if (!cancelled) {
          const message =
            caughtError instanceof Error ? caughtError.message : 'Failed to load on-chain history.'
          setError(message)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadHistory()

    return () => {
      cancelled = true
    }
  }, [address, isConnected, publicClient, refreshKey])

  return useMemo(
    () => ({
      createdEntries,
      paidEntries,
      receivedEntries,
      isLoading,
      error,
    }),
    [createdEntries, error, isLoading, paidEntries, receivedEntries],
  )
}
