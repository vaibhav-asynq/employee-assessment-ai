import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RefreshCcw } from "lucide-react";

type FallbackProps = {
  error: Error;
  resetErrorBoundary: () => void;
};

export function FallbackAiCompetenciesDisplay({
  error,
  resetErrorBoundary,
}: FallbackProps) {
  return (
    <div
      className={cn(
        "my-4 p-3",
        "w-full rounded-md mx-auto max-w-screen-sm",
        "flex flex-col gap-2",
        "text-destructive",
        "border border-destructive",
      )}
    >
      <div>
        <p>Something went wrong with data!</p>
        <p>Try again or Re-generate competencies.</p>
      </div>
      <div className="flex items-center justify-end">
        <Button
          onClick={resetErrorBoundary}
          variant={"destructive"}
          className="flex gap-1 items-center"
        >
          <RefreshCcw size={14} />
          try again
        </Button>
      </div>
    </div>
  );
}
