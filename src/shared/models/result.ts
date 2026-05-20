/**
 * Generic Result<T, E> für Server Actions — typsicheres Error-Handling ohne throw.
 */
export type Result<T, E = string> =
  | { success: true; data: T }
  | { success: false; error: E };

/** @returns Result mit success: true */
export function ok<T>(data: T): Result<T> {
  return { success: true, data };
}

/** @returns Result mit success: false */
export function err<E = string>(error: E): Result<never, E> {
  return { success: false, error };
}
