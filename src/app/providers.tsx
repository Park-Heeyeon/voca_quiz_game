import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import ModalProvider from "@/shared/ui/modal/ModalProvider";
import App from "./App";

const queryClient = new QueryClient();

const Providers: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <App />
      <ModalProvider />
    </BrowserRouter>
  </QueryClientProvider>
);

export default Providers;
