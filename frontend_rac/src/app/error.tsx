"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CircleAlert } from "lucide-react";
import { ErrorConeAnimation } from "@/components/animations/ErrorConeAnimation";

export default function Error({
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
    <div className="tb1 w-full flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <ErrorConeAnimation />
      <div className="flex gap-2 items-center text-destructive">
        <CircleAlert size={24} className="" />
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
      </div>
      <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-md">
        {"An unexpected error occurred."}
      </p>
      <div className="flex gap-4 mt-8">
        <Button onClick={reset} variant="default">
          Try Again
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Return to Home</Link>
        </Button>
      </div>
    </div>
  );
}
