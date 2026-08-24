import { createRoot } from "react-dom/client";
import { App, AppProvider } from "@/app";
import "@/app/styles/index.css";

async function enableMocking() {
  const { worker } = await import("./mocks/browser.ts");

  return worker.start();
}

const rootElement = document.getElementById("root");

if (!rootElement) throw new Error("Failed to find the root element");

enableMocking().then(() => {
  createRoot(rootElement).render(
    <AppProvider>
      <App />
    </AppProvider>
  );
});
