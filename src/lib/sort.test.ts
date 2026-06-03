import { describe, it, expect } from 'vitest'
import { nullsLastComparator } from './sort'

describe('nullsLastComparator', () => {
  it('sorts non-null strings ascending', () => {
    const items = [{ name: 'Zurich' }, { name: 'Mayfair' }, { name: 'Aberdeen' }]
    const comparator = nullsLastComparator((item) => item.name, 'asc')
    const sorted = [...items].sort(comparator)
    expect(sorted.map((item) => item.name)).toEqual(['Aberdeen', 'Mayfair', 'Zurich'])
  })

  it('sorts non-null strings descending', () => {
    const items = [{ name: 'Zurich' }, { name: 'Mayfair' }, { name: 'Aberdeen' }]
    const comparator = nullsLastComparator((item) => item.name, 'desc')
    const sorted = [...items].sort(comparator)
    expect(sorted.map((item) => item.name)).toEqual(['Zurich', 'Mayfair', 'Aberdeen'])
  })

  it('places null values last in ascending order', () => {
    const items = [{ name: null }, { name: 'Mayfair' }, { name: 'Aberdeen' }]
    const comparator = nullsLastComparator((item) => item.name, 'asc')
    const sorted = [...items].sort(comparator)
    expect(sorted.map((item) => item.name)).toEqual(['Aberdeen', 'Mayfair', null])
  })

  it('places null values last in descending order', () => {
    const items = [{ name: 'Mayfair' }, { name: null }, { name: 'Aberdeen' }]
    const comparator = nullsLastComparator((item) => item.name, 'desc')
    const sorted = [...items].sort(comparator)
    expect(sorted.map((item) => item.name)).toEqual(['Mayfair', 'Aberdeen', null])
  })

  it('places multiple nulls last', () => {
    const items = [{ name: null }, { name: 'Mayfair' }, { name: null }, { name: 'Aberdeen' }]
    const comparator = nullsLastComparator((item) => item.name, 'asc')
    const sorted = [...items].sort(comparator)
    expect(sorted[0]?.name).toBe('Aberdeen')
    expect(sorted[1]?.name).toBe('Mayfair')
    expect(sorted[2]?.name).toBeNull()
    expect(sorted[3]?.name).toBeNull()
  })

  it('sorts numbers ascending with nulls last', () => {
    const items = [{ value: 500 }, { value: null }, { value: 100 }, { value: null }, { value: 300 }]
    const comparator = nullsLastComparator((item) => item.value, 'asc')
    const sorted = [...items].sort(comparator)
    expect(sorted.map((item) => item.value)).toEqual([100, 300, 500, null, null])
  })

  it('sorts numbers descending with nulls last', () => {
    const items = [{ value: 500 }, { value: null }, { value: 100 }]
    const comparator = nullsLastComparator((item) => item.value, 'desc')
    const sorted = [...items].sort(comparator)
    expect(sorted.map((item) => item.value)).toEqual([500, 100, null])
  })

  it('treats two nulls as equal (stable)', () => {
    const items = [{ id: 1, name: null }, { id: 2, name: null }]
    const comparator = nullsLastComparator((item) => item.name, 'asc')
    const sorted = [...items].sort(comparator)
    expect(sorted.map((item) => item.id)).toEqual([1, 2])
  })
})
