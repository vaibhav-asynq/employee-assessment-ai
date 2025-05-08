import { useRef, useEffect, useCallback } from "react";

/**
 * Creates a debounced function that delays invoking the provided function
 * until after the specified wait time has elapsed since the last time it was invoked.
 *
 * @param func The function to debounce
 * @param wait The number of milliseconds to delay
 * @param options Additional options
 * @returns A debounced version of the provided function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait = 300,
  options: { leading?: boolean; trailing?: boolean; maxWait?: number } = {},
): T & { cancel: () => void; flush: () => void } {
  let lastArgs: Parameters<T> | null = null;
  let lastThis: any = null;
  let maxWait = options.maxWait;
  let result: ReturnType<T>;
  let timerId: ReturnType<typeof setTimeout> | null = null;
  let lastCallTime: number | null = null;
  let lastInvokeTime = 0;
  let leading = !!options.leading;
  let trailing = "trailing" in options ? !!options.trailing : true;

  function invokeFunc(time: number) {
    const args = lastArgs!;
    const thisArg = lastThis;

    lastArgs = lastThis = null;
    lastInvokeTime = time;
    result = func.apply(thisArg, args);
    return result;
  }

  function startTimer(pendingFunc: () => void, wait: number) {
    timerId = setTimeout(pendingFunc, wait) as unknown as ReturnType<
      typeof setTimeout
    >;
  }

  function cancelTimer() {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
  }

  function trailingEdge(time: number) {
    timerId = null;

    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = lastThis = null;
    return result;
  }

  function leadingEdge(time: number) {
    lastInvokeTime = time;
    timerId = startTimer(timerExpired, wait) as unknown as ReturnType<
      typeof setTimeout
    >;
    return leading ? invokeFunc(time) : result;
  }

  function remainingWait(time: number) {
    const timeSinceLastCall = time - (lastCallTime || 0);
    const timeSinceLastInvoke = time - lastInvokeTime;
    const timeWaiting = wait - timeSinceLastCall;

    return maxWait !== undefined
      ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
      : timeWaiting;
  }

  function shouldInvoke(time: number) {
    const timeSinceLastCall = time - (lastCallTime || 0);
    const timeSinceLastInvoke = time - lastInvokeTime;

    return (
      lastCallTime === null ||
      timeSinceLastCall >= wait ||
      timeSinceLastCall < 0 ||
      (maxWait !== undefined && timeSinceLastInvoke >= maxWait)
    );
  }

  function timerExpired() {
    const time = Date.now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    timerId = startTimer(
      timerExpired,
      remainingWait(time),
    ) as unknown as ReturnType<typeof setTimeout>;
    return undefined;
  }

  function debounced(this: any, ...args: Parameters<T>): ReturnType<T> {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastArgs = args;
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (timerId === null) {
        return leadingEdge(lastCallTime);
      }
      if (maxWait !== undefined) {
        timerId = startTimer(timerExpired, wait) as unknown as ReturnType<
          typeof setTimeout
        >;
        return invokeFunc(lastCallTime);
      }
    }
    if (timerId === null) {
      timerId = startTimer(timerExpired, wait) as unknown as ReturnType<
        typeof setTimeout
      >;
    }
    return result;
  }

  debounced.cancel = function () {
    cancelTimer();
    lastInvokeTime = 0;
    lastArgs = lastCallTime = lastThis = timerId = null;
  };

  debounced.flush = function () {
    return timerId === null ? result : trailingEdge(Date.now());
  };

  return debounced as T & { cancel: () => void; flush: () => void };
}

/**
 * A React hook that returns a debounced version of the provided function.
 * The debounced function will only be called after the specified delay has passed
 * since the last time it was invoked.
 *
 * @param callback The function to debounce
 * @param delay The number of milliseconds to delay
 * @param deps Dependencies array that will cause the debounced function to be recreated when changed
 * @returns A debounced version of the provided function
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay = 300,
  deps: React.DependencyList = [],
): T {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(
    debounce((...args: Parameters<T>) => {
      callbackRef.current(...args);
    }, delay),
    deps,
  ) as T;
}
