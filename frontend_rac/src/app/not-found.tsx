"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { Error404Animation } from "@/components/animations/Error404Animation";

export default function NotFound() {
  return (
    <div className="tb1 w-full flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <Error404Animation />
      <div className="mt-5 flex gap-2 items-center text-sky-800">
        <Info size={24} className="" />
        <h1 className="text-2xl font-semibold">
          Page Not Found
          {/* 404 */}
        </h1>
      </div>
      <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-md">
        The page you are looking for doesn&apos;t exist or has been moved.
      </p>
      <Button asChild className="mt-8">
        <Link href="/">Return to Home</Link>
      </Button>
    </div>
  );
}
