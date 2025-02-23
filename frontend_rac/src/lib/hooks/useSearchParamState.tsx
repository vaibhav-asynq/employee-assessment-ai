import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function useSearchParamState<T>(
  key: string,
  defaultValue: T,
): [T, (newValue: T) => void] {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get initial value from URL or use default
  const getInitialValue = () => {
    const paramValue = searchParams.get(key);
    return paramValue
      ? ((typeof defaultValue === "number"
          ? Number(paramValue)
          : paramValue) as T)
      : defaultValue;
  };

  const [value, setValue] = useState<T>(getInitialValue);

  // Update URL when value changes
  const updateValue = (newValue: T) => {
    setValue(newValue);

    // Get current URL
    const currentParams = new URLSearchParams(window.location.search);

    // Update or remove param
    if (newValue !== null && newValue !== undefined) {
      currentParams.set(key, String(newValue));
    } else {
      currentParams.delete(key);
    }

    // Push new URL
    router.push(`?${currentParams.toString()}`, { scroll: false });
  };

  // Sync with URL changes
  useEffect(() => {
    const paramValue = searchParams.get(key);
    if (paramValue) {
      setValue(
        typeof defaultValue === "number"
          ? Number(paramValue)
          : (paramValue as T),
      );
    }
  }, [searchParams, key, defaultValue]);

  return [value, updateValue];
}
