import { Component } from "react";
import Brand from "./Brand.jsx";

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Mentor Market render error", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="app-error-page">
        <Brand />
        <section>
          <span className="eyebrow">Something went wrong</span>
          <h1>This page needs a fresh start.</h1>
          <p>Your account data is safe. Reload the app, or return to the public marketplace.</p>
          <div>
            <button className="button" type="button" onClick={() => window.location.reload()}>Reload page</button>
            <a className="button button-ghost" href="/">Return home</a>
          </div>
        </section>
      </main>
    );
  }
}
