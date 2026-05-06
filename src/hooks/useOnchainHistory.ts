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
            if (CONTRACT_VERSION === 'v2') {
              const requestCreatedEvent = getAbiItem({
                abi: PAYMENT_REQUEST_V2_ABI,
                name: 'RequestCreated',
              })

              return client.getLogs({
                address: CONTRACT_ADDRESS,
                event: requestCreatedEvent,
                args: { recipient: walletAddress },
                fromBlock: CONTRACT_DEPLOYMENT_BLOCK,
                toBlock: 'latest',
              })
            }

            const requestCreatedEvent = getAbiItem({
              abi: PAYMENT_REQUEST_V1_ABI,
              name: 'RequestCreated',
            })

            return client.getLogs({
              address: CONTRACT_ADDRESS,
              event: requestCreatedEvent,
              args: { recipient: walletAddress },
              fromBlock: CONTRACT_DEPLOYMENT_BLOCK,
              toBlock: 'latest',
            })
          })(),
          (async () => {
            if (CONTRACT_VERSION === 'v2') {
              const requestPaidEvent = getAbiItem({
                abi: PAYMENT_REQUEST_V2_ABI,
                name: 'RequestPaid',
              })

              return client.getLogs({
                address: CONTRACT_ADDRESS,
                event: requestPaidEvent,
                args: { payer: walletAddress },
                fromBlock: CONTRACT_DEPLOYMENT_BLOCK,
                toBlock: 'latest',
              })
            }

            const requestPaidEvent = getAbiItem({
              abi: PAYMENT_REQUEST_V1_ABI,
              name: 'RequestPaid',
            })

            return client.getLogs({
              address: CONTRACT_ADDRESS,
              event: requestPaidEvent,
              args: { payer: walletAddress },
              fromBlock: CONTRACT_DEPLOYMENT_BLOCK,
              toBlock: 'latest',
            })
          })(),
          (async () => {
            if (CONTRACT_VERSION === 'v2') {
              const requestPaidEvent = getAbiItem({
                abi: PAYMENT_REQUEST_V2_ABI,
                name: 'RequestPaid',
              })

              return client.getLogs({
                address: CONTRACT_ADDRESS,
                event: requestPaidEvent,
                args: { recipient: walletAddress },
                fromBlock: CONTRACT_DEPLOYMENT_BLOCK,
                toBlock: 'latest',
              })
            }

            const requestPaidEvent = getAbiItem({
              abi: PAYMENT_REQUEST_V1_ABI,
              name: 'RequestPaid',
            })

            return client.getLogs({
              address: CONTRACT_ADDRESS,
              event: requestPaidEvent,
              fromBlock: CONTRACT_DEPLOYMENT_BLOCK,
              toBlock: 'latest',
            })
          })(),
        ])

        if (cancelled) {
          return
        }

        if (CONTRACT_VERSION === 'v2') {
          const createdLogsV2 = createdLogs as Array<{
            args: {
              id?: `0x${string}`
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
