const display = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean" || value === 0 || value === 1) return value === true || value === 1 ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  const text = String(value);
  return text.length > 65 ? `${text.slice(0, 62)}…` : text;
};

export default function DataTable({ rows, columns, actions, label = "Records" }) {
  return (
    <div className="table-wrap"><table className="data-table" aria-label={label}><thead><tr>{columns.map((column) => <th scope="col" key={column.key}>{column.label}</th>)}{actions && <th scope="col">Actions</th>}</tr></thead>
      <tbody>{rows.map((row) => <tr key={row.id ?? `${row.user_id}-${row.created_at}`}>
        {columns.map((column) => <td key={column.key} data-label={column.label}>{column.render ? column.render(row[column.key], row) : display(row[column.key])}</td>)}
        {actions && <td data-label="Actions"><div className="table-actions">{actions(row)}</div></td>}
      </tr>)}</tbody></table></div>
  );
}
