declare module 'pumpkin:plugin/uuid@0.1.0' {
  /**
   * Generates a new random v4 UUID.
   */
  export function generate(): Uuid;
  /**
   * Parses a UUID from a string. Returns none if the string is not a valid UUID.
   */
  export function parse(s: string): Uuid | undefined;
  /**
   * Converts a UUID to its standard string representation.
   */
  export function toString(id: Uuid): string;
  /**
   * A 128-bit UUID represented as two 64-bit integers.
   */
  export interface Uuid {
    high: bigint,
    low: bigint,
  }
}
