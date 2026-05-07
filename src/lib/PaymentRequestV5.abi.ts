import { PAYMENT_REQUEST_V4_ABI } from './PaymentRequestV4.abi'

export const PAYMENT_REQUEST_V5_ABI = [
  ...PAYMENT_REQUEST_V4_ABI,
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'bytes32', name: 'id', type: 'bytes32' },
      { indexed: true, internalType: 'address', name: 'payoutAddress', type: 'address' },
    ],
    name: 'RequestPayoutConfigured',
    type: 'event',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
      { internalType: 'string', name: 'label', type: 'string' },
      { internalType: 'address payable', name: 'payoutAddress', type: 'address' },
    ],
    name: 'createRequestWithPayout',
    outputs: [{ internalType: 'bytes32', name: 'id', type: 'bytes32' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
      { internalType: 'string', name: 'label', type: 'string' },
      { internalType: 'address payable', name: 'payoutAddress', type: 'address' },
    ],
    name: 'createReusableRequestWithPayout',
    outputs: [{ internalType: 'bytes32', name: 'id', type: 'bytes32' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'recipient', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
      { internalType: 'string', name: 'label', type: 'string' },
      { internalType: 'address payable', name: 'payoutAddress', type: 'address' },
    ],
    name: 'createRequestForWithPayout',
    outputs: [{ internalType: 'bytes32', name: 'id', type: 'bytes32' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'recipient', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
      { internalType: 'string', name: 'label', type: 'string' },
      { internalType: 'address payable', name: 'payoutAddress', type: 'address' },
    ],
    name: 'createReusableRequestForWithPayout',
    outputs: [{ internalType: 'bytes32', name: 'id', type: 'bytes32' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: 'id', type: 'bytes32' }],
    name: 'getPaymentCount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'id', type: 'bytes32' },
      { internalType: 'uint256', name: 'index', type: 'uint256' },
    ],
    name: 'getPayment',
    outputs: [
      { internalType: 'address', name: 'payer', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
      { internalType: 'uint256', name: 'paidAt', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    name: 'requestPayoutAddresses',
    outputs: [{ internalType: 'address payable', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address payable', name: 'recipient', type: 'address' }],
    name: 'releaseQueuedProceeds',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const
