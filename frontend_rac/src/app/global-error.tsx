"use client";

import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { CircleAlert } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
          <div className="flex gap-1 items-center text-destructive">
            <CircleAlert size={24} />
            <h1 className="text-3xl font-bold">Internal Server Error</h1>
          </div>
          <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-md">
            The application encountered a critical error and could not continue.
          </p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-500 max-w-md">
            reload page or click `Try again` below
          </p>
          <Button onClick={reset} className="mt-8">
            Try Again
          </Button>
        </div>
      </body>
    </html>
  );
}
