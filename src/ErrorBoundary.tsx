import type { ReactNode, ErrorInfo } from "react";
import { Component } from "react";

type Props = { children: ReactNode };
type State = { error: unknown | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: unknown): State {
    return { error };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error("ErrorBoundary:", error, info);
  }

  render() {
    if (this.state.error) {
      const msg =
        typeof this.state.error === "object" &&
        this.state.error !== null &&
        "stack" in (this.state.error as any)
          ? String((this.state.error as any).stack)
          : String(this.state.error);

      return (
        <div style={{ padding: 16, color: "#fff", fontFamily: "system-ui" }}>
          <h2 style={{ margin: "0 0 8px" }}>页面出错了</h2>
          <pre style={{ whiteSpace: "pre-wrap", opacity: 0.85, margin: 0 }}>
            {msg}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
