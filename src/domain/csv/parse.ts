import type { RawCsvRow } from '../model/types'

export function parseCsv(text: string): RawCsvRow[] {
  const lines = text.split('\n').filter((line) => line.trim().length > 0)
  if (lines.length < 2) return []

  const headerLine = lines[0]
  if (!headerLine) return []
  const headers = headerLine.split(',').map((header) => header.trim())

  return lines.slice(1).map((line) => {
    const values = line.split(',').map((value) => value.trim())
    const row: Record<string, string | undefined> = {}

    headers.forEach((header, index) => {
      const rawValue = values[index]
      row[header] = rawValue === '' ? undefined : rawValue
    })

    return row as RawCsvRow
  })
}
