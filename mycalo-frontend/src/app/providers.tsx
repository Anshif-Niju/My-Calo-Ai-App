"use client";

import { store } from "@/store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { useState } from "react";
import { Provider } from "react-redux";
import  AuthInitializer  from "../components/shared/AuthInitilizer";

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  // We initialize the QueryClient inside state so it doesn't get recreated on every render
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      }),
  );

  return (
    <Provider store={store}>
      <AuthInitializer>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>{" "}
      </AuthInitializer>
    </Provider>
  );
}
