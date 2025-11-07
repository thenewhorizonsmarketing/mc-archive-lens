import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { SearchProvider } from "./lib/search-context.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <SearchProvider>
    <App />
  </SearchProvider>
);
