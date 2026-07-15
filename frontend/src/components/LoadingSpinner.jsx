export default function LoadingSpinner({ label = "Loading" }) {
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <span className="loading-orbit" aria-hidden="true"><i /><i /><i /></span>
      <span className="loading-copy"><strong>{label}</strong><small>Preparing your workspace</small></span>
    </div>
  );
}
