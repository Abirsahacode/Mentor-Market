import { AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react";

const icons = {
  error: XCircle,
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
};

export default function Alert({ type = "error", children }) {
  if (!children) return null;
  const normalizedType = icons[type] ? type : "info";
  const Icon = icons[normalizedType];
  const isUrgent = normalizedType === "error";
  return (
    <div
      className={`alert alert-${normalizedType}`}
      role={isUrgent ? "alert" : "status"}
      aria-live={isUrgent ? "assertive" : "polite"}
    >
      <Icon className="alert-icon" size={18} strokeWidth={2} aria-hidden="true" />
      <div className="alert-content">{children}</div>
    </div>
  );
}
