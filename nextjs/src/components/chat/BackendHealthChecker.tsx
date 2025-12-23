"use client";

import { useBackendHealth } from "@/hooks/useBackendHealth";

interface BackendHealthCheckerProps {
  onHealthStatusChange?: (isHealthy: boolean, isChecking: boolean) => void;
  children?: React.ReactNode;
}

/**
 * Backend health monitoring component that displays appropriate states
 * Uses the useBackendHealth hook for monitoring and retry logic
 */
export function BackendHealthChecker({
  onHealthStatusChange,
  children,
}: BackendHealthCheckerProps) {
  const { isBackendReady, isCheckingBackend, checkBackendHealth } =
    useBackendHealth();

  // Notify parent of health status changes
  React.useEffect(() => {
    if (onHealthStatusChange) {
      onHealthStatusChange(isBackendReady, isCheckingBackend);
    }
  }, [isBackendReady, isCheckingBackend, onHealthStatusChange]);

  // Show loading screen while checking backend
  if (isCheckingBackend) {
    return <BackendLoadingScreen />;
  }

  // Show error screen if backend is not ready
  if (!isBackendReady) {
    return <BackendErrorScreen onRetry={checkBackendHealth} />;
  }

  // Render children if backend is ready
  return <>{children}</>;
}

/**
 * Loading screen component shown while backend is starting up
 */
function BackendLoadingScreen() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-hidden relative">
      <div className="w-full max-w-2xl z-10 bg-neutral-900/50 backdrop-blur-md p-8 rounded-2xl border border-neutral-700 shadow-2xl shadow-black/60">
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-bold text-white flex items-center justify-center gap-3">
            ✨ AI Music Assistant 🚀
          </h1>

          <div className="flex flex-col items-center space-y-4">
            {/* Spinning animation */}
            <div className="relative">
              <div className="w-16 h-16 border-4 border-neutral-600 border-t-blue-500 rounded-full animate-spin"></div>
              <div
                className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-purple-500 rounded-full animate-spin"
                style={{
                  animationDirection: "reverse",
                  animationDuration: "1.5s",
                }}
              ></div>
            </div>

            <div className="space-y-2">
              <p className="text-xl text-neutral-300">
                Waiting for backend to be ready...
              </p>
              <p className="text-sm text-neutral-400">
                This may take a moment on first startup
              </p>
            </div>

            {/* Animated dots */}
            <div className="flex space-x-1">
              <div
                className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              ></div>
              <div
                className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              ></div>
              <div
                className="w-2 h-2 bg-pink-500 rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Error screen component shown when backend is unavailable
 */
function BackendErrorScreen({ onRetry }: { onRetry: () => Promise<boolean> }) {
  const handleRetry = () => {
    onRetry().catch((error) => {
      console.error("Retry failed:", error);
    });
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold text-red-400">Backend Unavailable</h2>
        <p className="text-neutral-300">
          Unable to connect to backend services
        </p>
        <button
          onClick={handleRetry}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

// Need to import React for useEffect
import React from "react";
