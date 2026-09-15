'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAccount, usePublicClient } from 'wagmi'
import { decodeEventLog, encodeEventTopics, formatEther, getAbiItem, type AbiEvent } from 'viem'
import {
  CONTRACT_ADDRESS,
  CONTRACT_DEPLOYMENT_BLOCK,
  CONTRACT_VERSION,
} from '@/lib/contract'
import { getRememberedRequestIds } from '@/lib/historyCache'
import { LITVM_EXPLORER_URL } from '@/lib/litvmNetwork'
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

const EXPLORER_PAGE_LIMIT = 1000

type ExplorerLog = {
  blockNumber: `0x${string}`
  data: `0x${string}`
  topics: `0x${string}`[]
  transactionHash: `0x${string}`
  logIndex: `0x${string}`
}

type ExplorerLogsParams = {
  event: AbiEvent
  args?: Record<string, `0x${string}`>
}

// LitVM RPC eth_getLogs times out on any range wider than a few blocks,
// so logs are read from the Blockscout explorer API instead.
async function fetchExplorerLogs(
  params: ExplorerLogsParams,
  fromBlock: bigint,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any[]> {
  const topics = encodeEventTopics({
    abi: [params.event],
    eventName: params.event.name,
    args: params.args,
  } as Parameters<typeof encodeEventTopics>[0])

  const query = new URLSearchParams({
    module: 'logs',
    action: 'getLogs',
    address: CONTRACT_ADDRESS,
    toBlock: 'latest',
  })
  topics.forEach((topic, index) => {
    if (typeof topic !== 'string') {
      return
    }
    query.set(`topic${index}`, topic)
    if (index > 0) {
      query.set(`topic0_${index}_opr`, 'and')
    }
  })

  const seen = new Set<string>()
  const decoded: Array<{ args: Record<string, unknown>; blockNumber: bigint }> = []
  let cursor = fromBlock

  while (true) {
    query.set('fromBlock', cursor.toString())
    const response = await fetch(`${LITVM_EXPLORER_URL}/api?${query}`)
    if (!response.ok) {
      throw new Error(`Explorer request failed with status ${response.status}.`)
    }

    const json = (await response.json()) as { message?: string; result?: ExplorerLog[] | string | null }
    if (!Array.isArray(json.result)) {
      if (/no logs found/i.test(json.message ?? '')) {
        break
      }
      throw new Error(`Explorer error: ${typeof json.result === 'string' ? json.result : json.message}`)
    }

    for (const log of json.result) {
      const key = `${log.transactionHash}:${log.logIndex}`
      if (seen.has(key)) {
        continue
      }
      seen.add(key)

      try {
        const { args } = decodeEventLog({
          abi: [params.event],
          data: log.data,
          topics: log.topics as [`0x${string}`, ...`0x${string}`[]],
        })
        decoded.push({ args: args as Record<string, unknown>, blockNumber: BigInt(log.blockNumber) })
      } catch {
        continue
      }
    }

    if (json.result.length < EXPLORER_PAGE_LIMIT) {
      break
    }

    const lastBlock = BigInt(json.result[json.result.length - 1].blockNumber)
    if (lastBlock <= cursor) {
      break
    }
    cursor = lastBlock
  }

  return decoded
}

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const MAX_PAYMENTS_PER_REQUEST = 50n

type V6RequestState = {
  id: `0x${string}`
  creator: `0x${string}`
  recipient: `0x${string}`
  amount: bigint
  label: string
  createdAt: bigint
  paymentCount: bigint
}

type V6Payment = {
  payer: `0x${string}`
  amount: bigint
  paidAt: bigint
}

// The explorer skips some blocks, so contract state is the source of truth
// for requests this wallet is known to have created or paid.
async function readV6Requests(
  publicClient: NonNullable<ReturnType<typeof usePublicClient>>,
  ids: `0x${string}`[],
) {
  const results = await Promise.all(
    [...new Set(ids)].map(async (id): Promise<V6RequestState | null> => {
      try {
        const raw = (await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: PAYMENT_REQUEST_V6_ABI,
          functionName: 'requests',
          args: [id],
        })) as readonly unknown[]

        const creator = raw[0] as `0x${string}`
        if (creator === ZERO_ADDRESS) {
          return null
        }

        return {
          id,
          creator,
          recipient: raw[1] as `0x${string}`,
          amount: raw[2] as bigint,
          label: raw[3] as string,
          createdAt: raw[4] as bigint,
          paymentCount: raw[9] as bigint,
        }
      } catch {
        return null
      }
    }),
  )

  return results.filter((state): state is V6RequestState => state !== null)
}

async function readV6Payments(
  publicClient: NonNullable<ReturnType<typeof usePublicClient>>,
  id: `0x${string}`,
  paymentCount: bigint,
) {
  const start = paymentCount > MAX_PAYMENTS_PER_REQUEST ? paymentCount - MAX_PAYMENTS_PER_REQUEST : 0n
  const indices = Array.from({ length: Number(paymentCount - start) }, (_, offset) => start + BigInt(offset))

  const results = await Promise.all(
    indices.map(async (index): Promise<V6Payment | null> => {
      try {
        const [payer, amount, paidAt] = (await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: PAYMENT_REQUEST_V6_ABI,
          functionName: 'getPayment',
          args: [id, index],
        })) as readonly [`0x${string}`, bigint, bigint]

        return { payer, amount, paidAt }
      } catch {
        return null
      }
    }),
  )

  return results.filter((payment): payment is V6Payment => payment !== null)
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

              return fetchExplorerLogs(
                {
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

            return fetchExplorerLogs(
              {
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

              return fetchExplorerLogs(
                {
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

            return fetchExplorerLogs(
              {
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

              return fetchExplorerLogs(
                {
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

            return fetchExplorerLogs(
              {
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

          if (CONTRACT_VERSION === 'v6') {
            const wallet = walletAddress.toLowerCase()
            const remembered = getRememberedRequestIds(walletAddress)
            const states = await readV6Requests(client, [
              ...nextCreatedEntries.map(entry => entry.id),
              ...remembered.created,
              ...remembered.paid,
            ])

            if (cancelled) {
              return
            }

            const createdIds = new Set(nextCreatedEntries.map(entry => entry.id))
            for (const state of states) {
              if (state.creator.toLowerCase() !== wallet || createdIds.has(state.id)) {
                continue
              }
              createdIds.add(state.id)
              nextCreatedEntries.push({
                id: state.id,
                url: toPaymentUrl(state.id),
                label: state.label,
                amount: state.amount,
                amountDisplay: toAmountDisplay(state.amount),
                timestamp: Number(state.createdAt),
                counterparty: state.recipient,
              })
            }

            const paymentsByRequest = await Promise.all(
              states
                .filter(
                  state =>
                    state.paymentCount > 0n &&
                    (state.recipient.toLowerCase() === wallet || remembered.paid.includes(state.id)),
                )
                .map(async state => [state, await readV6Payments(client, state.id, state.paymentCount)] as const),
            )

            if (cancelled) {
              return
            }

            const paidKeys = new Set(nextPaidEntries.map(entry => `${entry.id}:${entry.timestamp}`))
            const receivedKeys = new Set(nextReceivedEntries.map(entry => `${entry.id}:${entry.timestamp}`))
            for (const [state, payments] of paymentsByRequest) {
              for (const payment of payments) {
                const timestamp = Number(payment.paidAt)
                const key = `${state.id}:${timestamp}`
                const entry = {
                  id: state.id,
                  url: toPaymentUrl(state.id),
                  label: state.label,
                  amount: payment.amount,
                  amountDisplay: toAmountDisplay(payment.amount),
                  timestamp,
                }

                if (state.recipient.toLowerCase() === wallet && !receivedKeys.has(key)) {
                  receivedKeys.add(key)
                  nextReceivedEntries.push({ ...entry, counterparty: payment.payer })
                }

                if (payment.payer.toLowerCase() === wallet && !paidKeys.has(key)) {
                  paidKeys.add(key)
                  nextPaidEntries.push({ ...entry, counterparty: state.recipient })
                }
              }
            }

            nextCreatedEntries.sort((a, b) => b.timestamp - a.timestamp)
            nextPaidEntries.sort((a, b) => b.timestamp - a.timestamp)
            nextReceivedEntries.sort((a, b) => b.timestamp - a.timestamp)
          }

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
