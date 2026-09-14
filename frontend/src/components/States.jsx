import { Component } from "react";
import { AlertCircle, Inbox, RefreshCw } from "lucide-react";
export function Skeleton({ variant = "dashboard" }) {
  return (
    <div
      className={`skeleton-view ${variant}`}
      role="status"
      aria-label="Loading content"
      aria-busy="true"
    >
      <span className="sr-only">Loading content...</span>
      <div className="skeleton skeleton-heading" />
      {variant === "dashboard" && (
        <div className="metrics-grid">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton skeleton-metric" />
          ))}
        </div>
      )}
      {[0, 1, 2].map((i) => (
        <div className="skeleton skeleton-row" key={i} />
      ))}
    </div>
  );
}
export function EmptyState({
  title = "Nothing here yet",
  description,
  action,
  compact = false,
}) {
  return (
    <div className={`empty-state ${compact ? "compact" : ""}`}>
      <div className="empty-art">
        <Inbox size={26} />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function ErrorState({
  message = "We couldn't load this content. Please try again.",
  retry,
}) {
  return (
    <div className="error-state" role="alert">
      <AlertCircle size={25} />
      <div>
        <h3>Something didn't load</h3>
        <p>{message}</p>
      </div>
      {retry && (
        <button className="btn-secondary" onClick={retry}>
          <RefreshCw size={16} />
          Try again
        </button>
      )}
    </div>
  );
}
export class ErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidUpdate(previous) {
    if (previous.resetKey !== this.props.resetKey && this.state.failed)
      this.setState({ failed: false });
  }
  render() {
    return this.state.failed ? (
      <ErrorState
        message="This view hit an unexpected problem. Retry to reopen it."
        retry={() => this.setState({ failed: false })}
      />
    ) : (
      this.props.children
    );
  }
}
