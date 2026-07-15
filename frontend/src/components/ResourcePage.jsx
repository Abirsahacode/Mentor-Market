import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import useApi from "../hooks/useApi.js";
import Alert from "./Alert.jsx";
import DataTable from "./DataTable.jsx";
import EmptyState from "./EmptyState.jsx";
import LoadingSpinner from "./LoadingSpinner.jsx";
import PageHeader from "./PageHeader.jsx";

export default function ResourcePage({ title, description, endpoint, columns, createPath, createLabel, actions, transform = (data) => data }) {
  const { data, loading, error, reload } = useApi(endpoint);
  const [query, setQuery] = useState("");
  const rows = transform(data || []);
  const visibleRows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) => Object.values(row).some((value) => {
      if (value === null || value === undefined) return false;
      return (typeof value === "object" ? JSON.stringify(value) : String(value)).toLowerCase().includes(needle);
    }));
  }, [query, rows]);
  return <section className="resource-page"><PageHeader eyebrow="Workspace" title={title} description={description} actions={createPath && <Link className="button" to={createPath}>+ {createLabel || "Create new"}</Link>} />
    <Alert>{error}</Alert><div className="resource-surface">{loading ? <LoadingSpinner /> : rows.length ? <><div className="resource-toolbar"><div><strong>{rows.length}</strong><span>record{rows.length === 1 ? "" : "s"}</span></div><label><Search size={15} /><span className="sr-only">Search {title}</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search these records" /></label></div>{visibleRows.length ? <DataTable label={title} rows={visibleRows} columns={columns} actions={actions ? (row) => actions(row, reload) : null} /> : <EmptyState icon={Search} title="No matching records" text="Try another word or clear the search field." />}</> : <EmptyState />}</div>
  </section>;
}
