import { useEffect, useRef, useCallback } from "react";

/**
 * 탭 포커스 연동 폴링 훅
 * - enabled가 true일 때만 intervalMs 간격으로 callback 실행
 * - 탭 비활성시 폴링 중단, 활성시 즉시 실행 후 재개
 */
const usePolling = (callback, intervalMs = 3000, enabled = true) => {
  const callbackRef = useRef(callback);
  const intervalRef = useRef(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const startPolling = useCallback(() => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => {
      callbackRef.current();
    }, intervalMs);
  }, [intervalMs]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      stopPolling();
      return;
    }

    startPolling();

    const handleVisibility = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        callbackRef.current();
        startPolling();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [enabled, startPolling, stopPolling]);
};

export default usePolling;
