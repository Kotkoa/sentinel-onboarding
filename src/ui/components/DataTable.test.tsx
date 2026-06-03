import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { DataTable } from './DataTable'
import { axe } from '../../test/setup'

interface TestRow {
  id: string
  name: string
  value: number
}

const columns = [
  {
    key: 'id',
    header: 'ID',
    render: (row: TestRow) => row.id,
  },
  {
    key: 'name',
    header: 'Name',
    render: (row: TestRow) => row.name,
  },
  {
    key: 'value',
    header: 'Value',
    render: (row: TestRow) => row.value.toString(),
  },
]

const rows: TestRow[] = [
  { id: 'r1', name: 'Alice', value: 100 },
  { id: 'r2', name: 'Bob', value: 200 },
  { id: 'r3', name: 'Carol', value: 300 },
]

describe('DataTable', () => {
  it('renders correct number of rows', () => {
    render(
      <DataTable
        columns={columns}
        rows={rows}
        getRowKey={(row) => row.id}
        ariaLabel="Test table"
      />,
    )
    const table = screen.getByRole('table')
    const bodyRows = within(table).getAllByRole('row').slice(1)
    expect(bodyRows).toHaveLength(3)
  })

  it('renders all column headers', () => {
    render(
      <DataTable
        columns={columns}
        rows={rows}
        getRowKey={(row) => row.id}
        ariaLabel="Test table"
      />,
    )
    expect(screen.getByRole('columnheader', { name: 'ID' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Value' })).toBeInTheDocument()
  })

  it('renders row data', () => {
    render(
      <DataTable
        columns={columns}
        rows={rows}
        getRowKey={(row) => row.id}
        ariaLabel="Test table"
      />,
    )
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  it('shows empty message when rows is empty', () => {
    render(
      <DataTable
        columns={columns}
        rows={[]}
        getRowKey={(row) => row.id}
        emptyMessage="No records found"
        ariaLabel="Empty table"
      />,
    )
    expect(screen.getByText('No records found')).toBeInTheDocument()
  })

  it('renders with aria-label', () => {
    render(
      <DataTable
        columns={columns}
        rows={rows}
        getRowKey={(row) => row.id}
        ariaLabel="Client data"
      />,
    )
    expect(screen.getByRole('table', { name: 'Client data' })).toBeInTheDocument()
  })

  it('renders sr-only caption', () => {
    const { container } = render(
      <DataTable
        columns={columns}
        rows={rows}
        getRowKey={(row) => row.id}
        caption="Screen reader caption"
      />,
    )
    const caption = container.querySelector('caption')
    expect(caption).toHaveTextContent('Screen reader caption')
    expect(caption?.className).toContain('sr-only')
  })

  it('has no a11y violations', async () => {
    const { container } = render(
      <DataTable
        columns={columns}
        rows={rows}
        getRowKey={(row) => row.id}
        ariaLabel="Accessible table"
        caption="Table of test data"
      />,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has no a11y violations when empty', async () => {
    const { container } = render(
      <DataTable
        columns={columns}
        rows={[]}
        getRowKey={(row) => row.id}
        ariaLabel="Empty table"
      />,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
