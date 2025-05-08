import { useState, useCallback } from "react";
import { handleError } from "@/lib/errorHandling";

interface ApiCallState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface ApiCallOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  resetOnCall?: boolean;
}

/**
 * A hook for making API calls with standardized loading, error, and success states
 */
export function useApiCall<T = any>(
  apiFunction: (...args: any[]) => Promise<T>,
  options: ApiCallOptions = {},
) {
  const [state, setState] = useState<ApiCallState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const { onSuccess, onError, resetOnCall = true } = options;

  const execute = useCallback(
    async (...args: any[]) => {
      if (resetOnCall) {
        setState((prev) => ({ ...prev, loading: true, error: null }));
      } else {
        setState((prev) => ({ ...prev, loading: true }));
      }

      try {
        const result = await apiFunction(...args);
        setState({ data: result, loading: false, error: null });
        onSuccess?.(result);
        return result;
      } catch (error) {
        const errorMessage = handleError(error);
        setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
        onError?.(errorMessage);
        throw error;
      }
    },
    [apiFunction, onSuccess, onError, resetOnCall],
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    execute,
    reset,
    clearError,
  };
}
