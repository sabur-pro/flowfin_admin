import type { ReactNode } from 'react';

export interface Column<T> {
  readonly key: string;
  readonly header: string;
  readonly align?: 'left' | 'right';
  readonly render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  readonly columns: readonly Column<T>[];
  readonly rows: readonly T[];
  readonly rowKey: (row: T) => string;
  readonly highlight?: (row: T) => boolean;
  readonly empty?: string;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  highlight,
  empty = 'Пока пусто',
}: DataTableProps<T>) {
  if (rows.length === 0) {
    return <p className="empty">{empty}</p>;
  }

  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} data-align={column.align ?? 'right'}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} data-active={highlight?.(row) ? '1' : undefined}>
              {columns.map((column) => (
                <td key={column.key} data-align={column.align ?? 'right'}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
