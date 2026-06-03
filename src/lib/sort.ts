export type SortDirection = 'asc' | 'desc'

export function nullsLastComparator<T>(
  getValue: (item: T) => string | number | null,
  direction: SortDirection,
): (a: T, b: T) => number {
  return (a: T, b: T): number => {
    const aValue = getValue(a)
    const bValue = getValue(b)

    if (aValue === null && bValue === null) return 0
    if (aValue === null) return 1
    if (bValue === null) return -1

    if (aValue < bValue) return direction === 'asc' ? -1 : 1
    if (aValue > bValue) return direction === 'asc' ? 1 : -1
    return 0
  }
}
