import { AlertCircle, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import useApi from "../hooks/useApi.js";
import Alert from "./Alert.jsx";
import DataTable from "./DataTable.jsx";
import EmptyState from "./EmptyState.jsx";
import PageHeader from "./PageHeader.jsx";
import { SkeletonTable } from "./Skeleton.jsx";

export default function ResourcePage({
  title,
  description,
  endpoint,
  columns,
  createPath,
  createLabel,
  actions,
  feedback,
  headingLevel,
  emptyState = {},
  striped = false,
  transform = (data) => data,
}) {
  const { data, loading, error, reload } = useApi(endpoint);
  const [query, setQuery] = useState("");
  const rows = transform(data || []);
  const resolvedEmptyState = {
    title: `No ${title.toLowerCase()} yet`,
    description: "Items added to this workspace will appear here.",
    ...emptyState,
  };
  const visibleRows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) => Object.values(row).some((value) => {
      if (value === null || value === undefined) return false;
      return (typeof value === "object" ? JSON.stringify(value) : String(value)).toLowerCase().includes(needle);
    }));
  }, [query, rows]);

  let content;
  if (loading) {
    content = <SkeletonTable columns={columns.length + (actions ? 1 : 0)} label={`Loading ${title.toLowerCase()}`} />;
  } else if (rows.length) {
    content = (
      <>
        <div className="resource-toolbar">
          <div><strong>{rows.length}</strong><span>record{rows.length === 1 ? "" : "s"}</span></div>
          <label>
            <Search size={15} />
            <span className="sr-only">Search {title}</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search these records" />
          </label>
        </div>
        {visibleRows.length ? (
          <DataTable label={title} rows={visibleRows} columns={columns} actions={actions ? (row) => actions(row, reload) : null} striped={striped} />
        ) : (
          <EmptyState
            icon={Search}
            title="No matching records"
            description="Try another word or clear the search field."
            action={<button type="button" className="button button-ghost" onClick={() => setQuery("")}>Clear search</button>}
          />
        )}
      </>
    );
  } else if (error) {
    content = (
      <EmptyState
        icon={AlertCircle}
        title="These records could not load"
        description="Try the request again to restore the latest workspace data."
        action={<button type="button" className="button button-ghost" onClick={reload}>Try again</button>}
      />
    );
  } else {
    content = <EmptyState {...resolvedEmptyState} />;
  }

  return (
    <section className="resource-page">
      <PageHeader
        eyebrow="Workspace"
        title={title}
        description={description}
        headingLevel={headingLevel}
        actions={createPath && <Link className="button" to={createPath}>+ {createLabel || "Create new"}</Link>}
      />
      <Alert type={feedback?.type}>{feedback?.message}</Alert>
      <Alert>{error}</Alert>
      <div className="resource-surface" aria-busy={loading}>{content}</div>
    </section>
  );
}
