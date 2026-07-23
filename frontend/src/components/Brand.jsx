import { Link } from "react-router-dom";

export function BrandMark({ size = 36 }) {
  return (
    <svg className="brand-symbol" width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="38" height="38" rx="11" fill="currentColor" />
      <path d="M8.5 11.8c4.6 0 8.4 1.35 11.5 4.05v13.1c-3.1-2.55-6.9-3.82-11.5-3.82V11.8Z" stroke="var(--brand-mark-line, white)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M31.5 11.8c-4.6 0-8.4 1.35-11.5 4.05v13.1c3.1-2.55 6.9-3.82 11.5-3.82V11.8Z" stroke="var(--brand-mark-line, white)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="14" cy="17.8" r="1.25" fill="var(--brand-mark-accent, #f1a184)" />
      <circle cx="26" cy="17.8" r="1.25" fill="var(--brand-mark-accent, #f1a184)" />
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
