export default function LoadingSpinner({ label = "Loading", detail = "Getting things ready" }) {
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <span className="loading-orbit" aria-hidden="true"><i /><i /><i /></span>
      <span className="loading-copy"><strong>{label}</strong>{detail ? <small>{detail}</small> : null}</span>
    </div>
  );
}
