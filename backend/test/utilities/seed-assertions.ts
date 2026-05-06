import { BadRequestException, ForbiddenException } from '@nestjs/common';

/**
 * Assert that a state transition is allowed (does not throw).
 */
export function assertStateTransition(
  validateFn: () => void,
  from: string,
  to: string,
): void {
  expect(() => validateFn()).not.toThrow();
}

/**
 * Assert that a state transition is blocked (throws BadRequestException).
 */
export function assertStateTransitionBlocked(
  validateFn: () => void,
  from: string,
  to: string,
  expectedMessage?: string,
): void {
  try {
    validateFn();
    fail(`Expected BadRequestException for ${from} → ${to}`);
  } catch (err) {
    expect(err).toBeInstanceOf(BadRequestException);
    if (expectedMessage) {
      expect((err as Error).message).toContain(expectedMessage);
    }
  }
}

/**
 * Assert that a gate blocks the transition (throws ForbiddenException).
 */
export function assertGateBlocked(
  executeFn: () => Promise<any>,
  expectedGate?: string,
): Promise<void> {
  return executeFn()
    .then(() => fail('Expected ForbiddenException for gate block'))
    .catch((err) => {
      expect(err).toBeInstanceOf(ForbiddenException);
      if (expectedGate) {
        expect(err.message).toContain(expectedGate);
      }
    });
}

/**
 * Assert journal entry is balanced (total debits = total credits).
 */
export function assertJournalBalanced(
  debitAmount: number,
  creditAmount: number,
): void {
  expect(debitAmount).toBe(creditAmount);
}

/**
 * Assert inventory quantity is consistent between cache and transactions.
 */
export function assertInventoryConsistent(
  cacheQty: number,
  calculatedQty: number,
): void {
  expect(cacheQty).toBe(calculatedQty);
}

/**
 * Assert an API response has expected structure.
 */
export function assertApiResponse(
  response: { status: number; body: any },
  expectedStatus: number = 200,
  expectedKeys: string[] = [],
): void {
  expect(response.status).toBe(expectedStatus);
  for (const key of expectedKeys) {
    expect(response.body).toHaveProperty(key);
  }
}

/**
 * Assert an array is sorted by a given key.
 */
export function assertSortedBy<T>(
  arr: T[],
  key: keyof T,
  order: 'asc' | 'desc' = 'asc',
): void {
  for (let i = 1; i < arr.length; i++) {
    if (order === 'asc') {
      expect(arr[i][key] >= arr[i - 1][key]).toBe(true);
    } else {
      expect(arr[i][key] <= arr[i - 1][key]).toBe(true);
    }
  }
}

/**
 * Fail helper for promise-based assertions.
 */
function fail(message: string): never {
  throw new Error(message);
}
