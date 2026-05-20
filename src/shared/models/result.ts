/**
 * Generic Result type für Server Actions.
 * Ersetzt throw-basiertes Error-Handling für agentenfreundliche Interfaces.
 */
export type Result<T, E = string> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * @param data - Erfolgs-Payload
 * @returns Result mit success: true
 */
export function ok<T>(data: T): Result<T> {
  return { success: true, data };
}

/**
 * @param error - Fehlermeldung
 * @returns Result mit success: false
 */
export function err<E = string>(error: E): Result<never, E> {
  return { success: false, error };
}
