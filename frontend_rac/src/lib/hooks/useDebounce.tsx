import { useEffect, useRef } from "react";

export function useDebounce(
  callback: () => void,
  delay: number,
  dependencies: unknown[],
) {
  const timeoutRef = useRef<NodeJS.Timeout>(null);

  useEffect(() => {
    timeoutRef.current = setTimeout(callback, delay);
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies, callback, delay]);
}
