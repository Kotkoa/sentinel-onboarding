import type { FC, ReactNode } from 'react'

interface Column<TRow> {
  key: string
  header: string
  render: (row: TRow, index: number) => ReactNode
  headerClassName?: string
  cellClassName?: string
}

interface DataTableProps<TRow> {
  columns: Column<TRow>[]
  rows: TRow[]
  getRowKey: (row: TRow, index: number) => string
  caption?: string
  ariaLabel?: string
  emptyMessage?: string
}

export function DataTable<TRow>({
  columns,
  rows,
  getRowKey,
  caption,
  ariaLabel,
  emptyMessage = 'No data available.',
}: DataTableProps<TRow>): ReturnType<FC> {
  return (
    <div className="overflow-x-auto rounded-card shadow-card">
      <table
        className="w-full bg-card text-sm"
        aria-label={ariaLabel}
      >
        {caption && (
          <caption className="sr-only">{caption}</caption>
        )}
        <thead>
          <tr className="border-b border-neutral/20 bg-background">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`px-4 py-3 text-left font-semibold text-text ${column.headerClassName ?? ''}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-neutral"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr
                key={getRowKey(row, index)}
                className="border-b border-neutral/10 hover:bg-background/60 transition-colors"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-4 py-3 ${column.cellClassName ?? ''}`}
                  >
                    {column.render(row, index)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
