import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initMonitoring, ErrorBoundary } from "./lib/monitoring";

// Initialize monitoring tools
initMonitoring();

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary fallback={<p>An error has occurred. Our team has been notified.</p>}>
    <App />
  </ErrorBoundary>
);
