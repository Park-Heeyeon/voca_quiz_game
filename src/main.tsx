import { createRoot } from "react-dom/client";
import Providers from "./app/providers";
import "./index.css";

async function enableMocking() {
  const { worker } = await import("./mocks/browser");
  return worker.start({ onUnhandledRequest: "bypass" });
}

const rootElement = document.getElementById("root");

if (!rootElement) throw new Error("Failed to find the root element");

enableMocking().then(() => {
  createRoot(rootElement).render(<Providers />);
});
