"use client";
//INFO: in this file wrap with Providers that needs in whole app
import { ClerkProvider } from "@clerk/nextjs";
import { Suspense } from "react";
import { ClerkAuthSync } from "../auth/ClerkAuthSync";
import { SidebarProvider } from "../ui/sidebar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={<Skeleton />}>
          <ClerkProvider>
            <ClerkAuthSync />
            <SidebarProvider>{children}</SidebarProvider>
          </ClerkProvider>
        </Suspense>
      </QueryClientProvider>
    </>
  );
}

//TODO: create dedicated skeleton page
//INFO: [this will work if ClerkProvider is dynamic]
function Skeleton() {
  return <div>Loading...</div>;
}
