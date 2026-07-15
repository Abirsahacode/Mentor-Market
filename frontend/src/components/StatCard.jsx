export default function StatCard({ icon, label, value, hint, tone = "blue", trend }) {
  const Icon = (typeof icon === "function" || (typeof icon === "object" && icon)) ? icon : null;
  const displayValue = value ?? 0;
  return (
    <article className={`stat-card stat-${tone}`} aria-label={`${label}: ${displayValue}`}>
      <div className="stat-card-glow" aria-hidden="true" />
      <div className="stat-card-top">
        <span className="stat-icon" aria-hidden="true">{Icon ? <Icon size={20} strokeWidth={1.9} /> : icon}</span>
        {trend && <span className="stat-trend">{trend}</span>}
      </div>
      <div className="stat-copy"><p>{label}</p><strong>{displayValue}</strong>{hint && <small>{hint}</small>}</div>
    </article>
  );
}
