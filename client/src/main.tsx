import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Import flow testing utilities and logger
import { initTestFlows } from "./lib/test-flows";
import FlowLogger from "./lib/flow-logger";
import "./lib/dev-tools";

// Import and enable JSON parsing fix
import { enableJsonParseMonkeyPatch } from "@shared/utils/json";

// Enable JSON.parse debugging in development mode
if (import.meta.env.DEV) {
  enableJsonParseMonkeyPatch();
}

// Initialize application
const initApp = () => {
  // Log application startup
  FlowLogger.log('Application', 'VMB Application Starting');
  
  // Create React root and render app
  createRoot(document.getElementById("root")!).render(<App />);

  // Initialize flow testing utilities in development
  if (import.meta.env.DEV) {
    FlowLogger.log('Application', 'Initializing Development Tools');
    initTestFlows();
  }
  
  // Log application startup complete
  FlowLogger.success('Application', 'VMB Application Started Successfully');
};

// Start the application
initApp();
