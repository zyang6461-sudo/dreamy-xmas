import ReactDOM from "react-dom/client";
import { Suspense } from "react";
import App from "./App";
import "./index.css";
import { ErrorBoundary } from "./ErrorBoundary";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <Suspense
      fallback={
        <div style={{ color: "#fff", padding: 12, fontFamily: "system-ui" }}>
          Loading…
        </div>
      }
    >
      <App />
    </Suspense>
  </ErrorBoundary>
);
