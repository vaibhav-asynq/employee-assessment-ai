"use client";
//INFO: in this file wrap with Providers that needs in whole app
import { ClerkProvider } from "@clerk/nextjs";
import { Suspense } from "react";
import { ClerkAuthSync } from "../auth/ClerkAuthSync";
import { SidebarProvider } from "../ui/sidebar";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={<Skeleton />}>
        <ClerkProvider>
          <ClerkAuthSync />
          <SidebarProvider>{children}</SidebarProvider>
        </ClerkProvider>
      </Suspense>
    </>
  );
}

//TODO: create dedicated skeleton page
//INFO: [this will work if ClerkProvider is dynamic]
function Skeleton() {
  return <div>Loading...</div>;
}
