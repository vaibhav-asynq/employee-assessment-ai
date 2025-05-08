import React from "react";
import { AlertCircle, XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

interface ErrorDisplayProps {
  error: string | null;
  className?: string;
  onDismiss?: () => void;
}

/**
 * A reusable component for displaying error messages
 */
const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  className = "",
  onDismiss,
}) => {
  if (!error) return null;

  return (
    <Alert variant="destructive" className={`mb-4 ${className}`}>
      <div className="flex items-start">
        <div className="flex-grow">
          <AlertTitle className="font-semibold flex gap-1 items-center">
            <AlertCircle size={14} />
            Error
          </AlertTitle>
          <AlertDescription className="mt-1">{error}</AlertDescription>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-2 text-destructive-foreground hover:opacity-80"
            aria-label="Dismiss error"
          >
            <XCircle size={20} />
          </button>
        )}
      </div>
    </Alert>
  );
};

export default ErrorDisplay;
