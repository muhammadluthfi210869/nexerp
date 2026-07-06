/**
 * Prisma Relation Helper
 *
 * Converts an optional ID string to Prisma's `{ connect: { id } }` format.
 * If id is null/undefined, returns undefined (omits the relation).
 *
 * @example
 * // Instead of:
 * machineId: 'uuid'
 *
 * // Use:
 * machine: rel('uuid')
 */
export function rel(id: string | undefined | null) {
  return id && id.trim() !== '' ? { connect: { id } } : undefined;
}
