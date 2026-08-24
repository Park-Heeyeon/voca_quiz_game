import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import ModalProvider from "./components/modal/ModalProvider.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.tsx";
import "./index.css";

async function enableMocking() {
  const { worker } = await import("./mocks/browser.ts");

  return worker.start();
}

const rootElement = document.getElementById("root");

if (!rootElement) throw new Error("Failed to find the root element");

const queryClient = new QueryClient();

enableMocking().then(() => {
  createRoot(rootElement).render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <ModalProvider />
      </BrowserRouter>
    </QueryClientProvider>
  );
});
