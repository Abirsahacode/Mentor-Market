export default function MiniBarChart({ data, valueKey = "total", labelKey = "label", formatValue = (value) => value, ariaLabel = "Trend chart" }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map((item) => Number(item[valueKey]) || 0), 1);
  const barWidth = 100 / data.length;

  return (
    <div className="mini-bar-chart">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label={ariaLabel}>
        {data.map((item, index) => {
          const value = Number(item[valueKey]) || 0;
          const barHeight = value > 0 ? Math.max((value / max) * 100, 4) : 0;
          return (
            <rect
              key={item[labelKey] ?? index}
              x={index * barWidth + barWidth * 0.18}
              y={100 - barHeight}
              width={barWidth * 0.64}
              height={barHeight}
              rx="1.5"
              fill="currentColor"
            />
          );
        })}
      </svg>
      <div className="mini-bar-chart-labels">
        {data.map((item, index) => (
          <span key={item[labelKey] ?? index} title={formatValue(item[valueKey])}>{item[labelKey]}</span>
        ))}
      </div>
    </div>
  );
}
