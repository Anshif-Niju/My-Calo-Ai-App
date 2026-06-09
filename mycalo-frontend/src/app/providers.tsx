"use client";

import React, { useState } from "react";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { store } from "@/store";
import AuthInitializer from "@/components/shared/AuthInitializer";

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
      })
  );

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AuthInitializer/>
        {children}
      </QueryClientProvider>
    </Provider>
  );
}
