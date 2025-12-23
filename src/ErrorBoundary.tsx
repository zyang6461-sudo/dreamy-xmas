import { Component } from "react";
import type { ReactNode, ErrorInfo } from "react";

type Props = { children: ReactNode };
type State = { err?: unknown };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { err: undefined };

  static getDerivedStateFromError(err: unknown): State {
    return { err };
  }

  componentDidCatch(err: unknown, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", err, info);
  }

  render() {
    if (this.state.err) {
      return (
        <div style={{ padding: 16 }}>
          <h2>页面出错了</h2>
          <pre style={{ whiteSpace: "pre-wrap" }}>
            {String((this.state.err as any)?.stack ?? this.state.err)}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
