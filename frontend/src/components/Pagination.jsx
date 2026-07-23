import { ArrowLeft, ArrowRight } from "lucide-react";

const pageWindow = (page, pages) => {
  if (pages <= 3) return Array.from({ length: pages }, (_, index) => index + 1);
  if (page <= 2) return [1, 2, pages];
  if (page >= pages - 1) return [1, pages - 1, pages];
  return [1, page, pages];
};

export default function Pagination({ page, pages, onChange, label = "Results pagination" }) {
  if (pages <= 1) return null;
  const visiblePages = pageWindow(page, pages);

  return (
    <nav className="pagination" aria-label={label}>
      <button type="button" onClick={() => onChange(page - 1)} disabled={page <= 1}>
        <ArrowLeft size={15} /><span>Previous</span>
      </button>
      <div>
        {visiblePages.map((pageNumber, index) => <span key={pageNumber}>
          {index > 0 && pageNumber - visiblePages[index - 1] > 1 ? <i aria-hidden="true">…</i> : null}
          <button
            type="button"
            className={pageNumber === page ? "active" : ""}
            aria-current={pageNumber === page ? "page" : undefined}
            aria-label={`Page ${pageNumber}`}
            onClick={() => onChange(pageNumber)}
          >{pageNumber}</button>
        </span>)}
      </div>
      <button type="button" onClick={() => onChange(page + 1)} disabled={page >= pages}>
        <span>Next</span><ArrowRight size={15} />
      </button>
    </nav>
  );
}
