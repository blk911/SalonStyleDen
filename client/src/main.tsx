import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Import flow testing utilities (only in development)
import { initializeTestFlows } from "./lib/test-flows";
import FlowLogger from "./lib/flow-logger";

// Initialize application
const initApp = () => {
  // Log application startup
  FlowLogger.log('Application', 'VMB Application Starting');
  
  // Create React root and render app
  createRoot(document.getElementById("root")!).render(<App />);

  // Initialize flow testing utilities in development
  if (import.meta.env.DEV) {
    FlowLogger.log('Application', 'Initializing Development Tools');
    initializeTestFlows();
  }
  
  // Log application startup complete
  FlowLogger.success('Application', 'VMB Application Started Successfully');
};

// Start the application
initApp();
