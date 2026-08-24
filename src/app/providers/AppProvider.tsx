import { PropsWithChildren } from "react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ModalProvider } from "@/shared/ui";

const queryClient = new QueryClient();

const AppProvider = ({ children }: PropsWithChildren) => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      {children}
      <ModalProvider />
    </BrowserRouter>
  </QueryClientProvider>
);

export default AppProvider;
