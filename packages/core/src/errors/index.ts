/**
 * Errors module
 *
 * Exports all error classes and error handling utilities.
 */

export {
  OmoQuotaError,
  TrackerNotFoundError,
  StrategyNotFoundError,
  ConfigNotFoundError,
  ProviderNotFoundError,
  InvalidUsageError,
  ErrorCode,
} from '../types';

/**
 * Check if an error is an OmoQuotaError
 */
export function isOmoQuotaError(error: unknown): error is OmoQuotaError {
  return (
    error instanceof Error &&
    'code' in error &&
    'name' in error &&
    error.name === 'OmoQuotaError'
  );
}

/**
 * Wrap an error as OmoQuotaError
 */
export function wrapError(error: unknown, code: string, message?: string): OmoQuotaError {
  const errorMsg = error instanceof Error ? error.message : String(error);
  const wrapped = new Error(message || errorMsg) as OmoQuotaError;
  wrapped.name = 'OmoQuotaError';
  wrapped.code = code as any;
  wrapped.context = { originalError: errorMsg };
  return wrapped;
}
