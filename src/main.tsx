import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { initializeNetworkBlocker } from "./lib/utils/network-blocker";
import "./index.css";
import "./styles/content-accessibility.css";

// Initialize network blocker for offline operation (Requirement 8.3)
initializeNetworkBlocker();

createRoot(document.getElementById("root")!).render(<App />);
