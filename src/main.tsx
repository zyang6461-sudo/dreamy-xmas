import ReactDOM from "react-dom/client";
import { Suspense, StrictMode } from "react";
import App from "./App";
import "./index.css";
import { ErrorBoundary } from "./ErrorBoundary";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <Suspense fallback={<div style={{ color: "white", padding: 12 }}>Loading…</div>}>
        <App />
      </Suspense>
    </ErrorBoundary>
  </StrictMode>
);
