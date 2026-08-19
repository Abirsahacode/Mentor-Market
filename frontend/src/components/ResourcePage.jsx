import { AlertCircle, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import useApi from "../hooks/useApi.js";
import useDebouncedValue from "../hooks/useDebouncedValue.js";
import Alert from "./Alert.jsx";
import DataTable from "./DataTable.jsx";
import EmptyState from "./EmptyState.jsx";
import PageHeader from "./PageHeader.jsx";
import Pagination from "./Pagination.jsx";
import { SkeletonTable } from "./Skeleton.jsx";

const withQuery = (endpoint, params) => {
  const [path, existingQuery] = endpoint.split("?");
  const search = new URLSearchParams(existingQuery || "");
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") search.delete(key);
    else search.set(key, value);
  });
  const queryString = search.toString();
  return queryString ? `${path}?${queryString}` : path;
};

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
  paginated = false,
  pageSize = 20,
  extraQuery = {},
  toolbarExtra,
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const debouncedQuery = useDebouncedValue(query, 350);
  const extraQueryKey = JSON.stringify(extraQuery);

  useEffect(() => { setPage(1); }, [debouncedQuery, extraQueryKey]);

  const resolvedEndpoint = withQuery(endpoint, paginated
    ? { ...extraQuery, page, limit: pageSize, q: debouncedQuery || undefined }
    : extraQuery);

  const { data, meta, loading, error, reload } = useApi(resolvedEndpoint);
  const rows = transform(data || []);
  const resolvedEmptyState = {
    title: `No ${title.toLowerCase()} yet`,
    description: "Items added to this workspace will appear here.",
    ...emptyState,
  };
  const visibleRows = useMemo(() => {
    if (paginated) return rows;
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) => Object.values(row).some((value) => {
      if (value === null || value === undefined) return false;
      return (typeof value === "object" ? JSON.stringify(value) : String(value)).toLowerCase().includes(needle);
    }));
  }, [paginated, query, rows]);

  let content;
  if (loading) {
    content = <SkeletonTable columns={columns.length + (actions ? 1 : 0)} label={`Loading ${title.toLowerCase()}`} />;
  } else if (rows.length) {
    content = (
      <>
        <div className="resource-toolbar">
          <div><strong>{paginated ? (meta?.total ?? rows.length) : rows.length}</strong><span>record{(paginated ? (meta?.total ?? rows.length) : rows.length) === 1 ? "" : "s"}</span></div>
          {toolbarExtra}
          <label>
            <Search size={15} />
            <span className="sr-only">Search {title}</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search these records" />
          </label>
        </div>
        {visibleRows.length ? (
          <>
            <DataTable label={title} rows={visibleRows} columns={columns} actions={actions ? (row) => actions(row, reload) : null} striped={striped} />
            {paginated && meta && <Pagination page={meta.page} pages={meta.pages} onChange={setPage} label={`${title} pagination`} />}
          </>
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
