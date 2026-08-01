import { Sparkles } from "lucide-react";

export default function EmptyState({
  icon: Icon = Sparkles,
  title = "Nothing here yet",
  description,
  text,
  action,
  className = "",
}) {
  const supportingText = description ?? text ?? "New items will appear here.";
  return (
    <div className={`empty-state${className ? ` ${className}` : ""}`}>
      <div className="empty-state-visual" aria-hidden="true"><i /><span><Icon size={23} strokeWidth={1.8} /></span><i /></div>
      <h3>{title}</h3>
      <p>{supportingText}</p>
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}
