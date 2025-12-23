import { useState, useEffect, useCallback } from "react";

export interface UseBackendHealthReturn {
  // State
  isBackendReady: boolean;
  isCheckingBackend: boolean;
  lastChecked: Date | null;

  // Operations
  checkBackendHealth: () => Promise<boolean>;
  startHealthMonitoring: () => void;

  // Retry utility
  retryWithBackoff: <T>(
    fn: () => Promise<T>,
    maxRetries?: number,
    maxDuration?: number
  ) => Promise<T>;
}

/**
 * Custom hook for monitoring backend health and providing retry logic
 */
export function useBackendHealth(): UseBackendHealthReturn {
  const [isBackendReady, setIsBackendReady] = useState<boolean>(false);
  const [isCheckingBackend, setIsCheckingBackend] = useState<boolean>(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  // Retry utility with exponential backoff
  const retryWithBackoff = useCallback(
    async <T>(
      fn: () => Promise<T>,
      maxRetries: number = 10,
      maxDuration: number = 120000 // 2 minutes
    ): Promise<T> => {
      const startTime = Date.now();
      let lastError: Error;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        if (Date.now() - startTime > maxDuration) {
          throw new Error(`Retry timeout after ${maxDuration}ms`);
        }

        try {
          return await fn();
        } catch (error) {
          lastError = error as Error;
          const delay = Math.min(1000 * Math.pow(2, attempt), 5000); // Exponential backoff, max 5s
          console.log(
            `Attempt ${attempt + 1} failed, retrying in ${delay}ms...`,
            error
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }

      throw lastError!;
    },
    []
  );

  // Backend health check
  const checkBackendHealth = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch("/api/run_sse", {
        method: "OPTIONS",
        headers: {
          "Content-Type": "application/json",
        },
      });

      setLastChecked(new Date());
      return response.ok;
    } catch (error) {
      console.log("Backend not ready yet:", error);
      setLastChecked(new Date());
      return false;
    }
  }, []);

  // Start health monitoring with retry logic
  const startHealthMonitoring = useCallback((): void => {
    const checkBackend = async (): Promise<void> => {
      setIsCheckingBackend(true);

      // Check if backend is ready with retry logic
      const maxAttempts = 60; // 2 minutes with 2-second intervals
      let attempts = 0;

      while (attempts < maxAttempts) {
        const isReady = await checkBackendHealth();
        if (isReady) {
          setIsBackendReady(true);
          setIsCheckingBackend(false);
          return;
        }

        attempts++;
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds between checks
      }

      // If we get here, backend didn't come up in time
      setIsCheckingBackend(false);
      console.error("Backend failed to start within 2 minutes");
    };

    checkBackend();
  }, [checkBackendHealth]);

  // Start health monitoring on mount
  useEffect(() => {
    startHealthMonitoring();
  }, [startHealthMonitoring]);

  return {
    // State
    isBackendReady,
    isCheckingBackend,
    lastChecked,

    // Operations
    checkBackendHealth,
    startHealthMonitoring,

    // Retry utility
    retryWithBackoff,
  };
}
