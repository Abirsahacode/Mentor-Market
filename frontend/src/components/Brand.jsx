import { Link } from "react-router-dom";

export function BrandMark({ size = 36 }) {
  return (
    <svg className="brand-symbol" width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <rect width="40" height="40" rx="4" fill="currentColor" />
      <path d="M9 27V13l11 9 11-9v14" stroke="var(--brand-mark-line, white)" strokeWidth="2.8" strokeLinecap="square" strokeLinejoin="miter" />
    </svg>
  );
}

export default function Brand({ to = "/", light = false, compact = false, onClick }) {
  return (
    <Link className={`brand ${light ? "brand-light" : ""} ${compact ? "brand-compact" : ""}`} to={to} onClick={onClick} aria-label="Mentor Market home">
      <BrandMark size={compact ? 30 : 36} />
      <span className="brand-wordmark">Mentor Market</span>
    </Link>
  );
}
