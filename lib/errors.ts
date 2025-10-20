export const PaymentError = {
  // A code for when required parameters are missing in the callback
  InvalidParams: 'invalid_params',
  // A code for when the user is not logged in or doesn't own the order
  Unauthorized: 'unauthorized',
  // A generic code for when the payment was cancelled or failed before verification
  PaymentFailed: 'payment_failed',
  // A code for unexpected exceptions in your code
  ServerError: 'server_error',
  // A code for when the payment gateway fails to verify the transaction
  VerificationFailed: 'verification_failed',
  // A code for when the payment is already being processed (lock failed)
  LockFailed: 'lock_failed',
} as const
export type PaymentErrorType = (typeof PaymentError)[keyof typeof PaymentError]
