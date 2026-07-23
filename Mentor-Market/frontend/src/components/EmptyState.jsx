import { Sparkles } from "lucide-react";

export default function EmptyState({ icon: Icon = Sparkles, title = "Nothing here yet", text = "New items will appear here.", action }) {
  return (
    <div className="empty-state">
      <div className="empty-state-visual" aria-hidden="true"><i /><span><Icon size={23} strokeWidth={1.8} /></span><i /></div>
      <h3>{title}</h3>
      <p>{text}</p>
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}
