"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, useEffect } from "react";
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { useInterviewDataStore } from "@/zustand/store/interviewDataStore";

export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          // Increase staleTime to reduce unnecessary refetches
          staleTime: 1000 * 60 * 5, // 5 minutes
          // Increase cacheTime to keep data in cache longer
          gcTime: 1000 * 60 * 60 * 24, // 24 hours
          // Retry failed queries 3 times
          retry: 3,
          // Don't refetch on window focus by default
          refetchOnWindowFocus: false,
        },
      },
    });

    // Only run on client side
    if (typeof window !== 'undefined') {
      // Create a persister that uses localStorage
      const localStoragePersister = createSyncStoragePersister({
        storage: window.localStorage,
        key: 'EMPLOYEE_ASSESSMENT_REACT_QUERY_CACHE',
        // Throttle saving to storage to prevent excessive writes
        throttleTime: 1000,
      });

      // Setup persistence
      persistQueryClient({
        queryClient: client,
        persister: localStoragePersister,
        // Only persist successful queries
        dehydrateOptions: {
          shouldDehydrateQuery: (query: any) => {
            // Don't persist queries with errors
            return !query.state.error && query.state.status !== 'pending';
          },
        },
        // Maximum age of cache (7 days)
        maxAge: 1000 * 60 * 60 * 24 * 7,
      });

      console.log('React Query cache persistence configured');
    }

    return client;
  });

  const { fileId, setFileId } = useInterviewDataStore();

  // Log when the provider mounts and restore last selected fileId
  useEffect(() => {
    console.log('ReactQueryProvider mounted');
    
    // Attempt to restore any active fileId from localStorage
    const lastFileId = localStorage.getItem('LAST_SELECTED_FILE_ID');
    if (lastFileId) {
      console.log(`Found last selected fileId in localStorage: ${lastFileId}`);
      // Restore the fileId in the store
      setFileId(lastFileId);
    }
    
    return () => {
      console.log('ReactQueryProvider unmounted');
    };
  }, [setFileId]);

  // Save fileId to localStorage whenever it changes
  useEffect(() => {
    if (fileId) {
      console.log(`Saving fileId to localStorage: ${fileId}`);
      localStorage.setItem('LAST_SELECTED_FILE_ID', fileId);
    }
  }, [fileId]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
