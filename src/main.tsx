import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// biome-ignore lint/style/noNonNullAssertion: because
createRoot(document.getElementById("root")!).render(<App />);
