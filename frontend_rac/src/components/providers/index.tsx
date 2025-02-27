"use client";

//INFO: in this file wrap with Providers that needs in whole app
import { usePathname } from "next/navigation";
import { ProtectedRoute } from "../auth/ProtectedRoute";

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Don't apply ProtectedRoute to the login page
  if (pathname === "/login") {
    return <>{children}</>;
  }
  
  // Apply ProtectedRoute to all other pages
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
