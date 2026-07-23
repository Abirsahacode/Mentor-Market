export default function StatCard({ icon, label, value, hint, tone = "blue", trend }) {
  const Icon = (typeof icon === "function" || (typeof icon === "object" && icon)) ? icon : null;
  const displayValue = value ?? 0;
  return (
    <article className={`stat-card stat-${tone}`} aria-label={`${label}: ${displayValue}`}>
      <div className="stat-card-glow" aria-hidden="true" />
      <span className="stat-icon" aria-hidden="true">{Icon ? <Icon size={19} strokeWidth={1.9} /> : icon}</span>
      <div className="stat-copy">
        <p>{label}</p>
        <div className="stat-value-line">
          <strong>{displayValue}</strong>
          {trend && <span className="stat-trend">{trend}</span>}
        </div>
        {hint && <small>{hint}</small>}
      </div>
    </article>
  );
}
