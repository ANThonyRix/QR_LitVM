/**
 * Validates that a string is a valid bytes32 hex value (0x + 64 hex chars).
 */
export function isValidBytes32(value: string): value is `0x${string}` {
  return /^0x[0-9a-fA-F]{64}$/.test(value)
}

/**
 * Validates that a payment amount string is a valid positive number.
 * Returns an error message or null if valid.
 */
export function validatePaymentAmount(amount: string): string | null {
  if (!amount || amount.trim() === '') {
    return 'Amount is required'
  }

  const num = Number(amount)

  if (Number.isNaN(num)) {
    return 'Amount must be a valid number'
  }

  if (num <= 0) {
    return 'Amount must be greater than zero'
  }

  if (!Number.isFinite(num)) {
    return 'Amount must be a finite number'
  }

  // Prevent unreasonably large amounts (> 1 billion tokens)
  if (num > 1_000_000_000) {
    return 'Amount exceeds maximum allowed'
  }

  return null
}
