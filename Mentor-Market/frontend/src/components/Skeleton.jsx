const items = (count) => Array.from({ length: count }, (_, index) => index);

export function Skeleton({ className = "", variant = "text" }) {
  return <span className={`skeleton skeleton-${variant}${className ? ` ${className}` : ""}`} aria-hidden="true" />;
}

export function SkeletonCard({ count = 3, label = "Loading cards" }) {
  return (
    <div className="skeleton-grid skeleton-card-grid" role="status" aria-label={label}>
      {items(count).map((index) => (
        <article className="skeleton-card" aria-hidden="true" key={index}>
          <Skeleton variant="media" />
          <div className="skeleton-card-body">
            <Skeleton className="skeleton-short" />
            <Skeleton variant="title" />
            <Skeleton />
            <Skeleton className="skeleton-medium" />
            <div className="skeleton-card-footer"><Skeleton variant="avatar" /><Skeleton className="skeleton-short" /></div>
          </div>
        </article>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 6, columns = 5, label = "Loading records" }) {
  return (
    <div className="skeleton-table" role="status" aria-label={label} style={{ "--skeleton-columns": columns }}>
      <div className="skeleton-table-head" aria-hidden="true">
        {items(columns).map((index) => <Skeleton className="skeleton-short" key={index} />)}
      </div>
      {items(rows).map((row) => (
        <div className="skeleton-table-row" aria-hidden="true" key={row}>
          {items(columns).map((column) => <Skeleton className={column === 0 ? "skeleton-medium" : ""} key={column} />)}
        </div>
      ))}
    </div>
  );
}

export function SkeletonStat({ count = 4, label = "Loading summary" }) {
  return (
    <div className="stats-grid skeleton-stat-grid" role="status" aria-label={label}>
      {items(count).map((index) => (
        <article className="skeleton-stat" aria-hidden="true" key={index}>
          <Skeleton variant="icon" />
          <div><Skeleton className="skeleton-short" /><Skeleton variant="title" /><Skeleton className="skeleton-medium" /></div>
        </article>
      ))}
    </div>
  );
}

export default Skeleton;
