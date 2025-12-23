import { useState, useCallback, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { Message } from "@/types";
import { ProcessedEvent } from "@/components/ActivityTimeline";
import { StreamingConnectionManager } from "@/lib/streaming/connection-manager";
import { getEventTitle } from "@/lib/streaming/stream-utils";
import {
  StreamProcessingCallbacks,
  StreamingAPIPayload,
} from "@/lib/streaming/types";

export interface UseStreamingReturn {
  // State
  isLoading: boolean;
  currentAgent: string;

  // Operations
  startStream: (
    apiPayload: { message: string; userId: string; sessionId: string },
    onMessageUpdate: (message: Message) => void,
    onEventUpdate: (messageId: string, event: ProcessedEvent) => void,
    onWebsiteCountUpdate: (count: number) => void
  ) => Promise<void>;

  getEventTitle: (agentName: string) => string;
}

/**
 * Custom hook for managing SSE streaming connections and data processing
 */
export function useStreaming(
  retryFn: <T>(fn: () => Promise<T>) => Promise<T>
): UseStreamingReturn {
  // React state management
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentAgent, setCurrentAgent] = useState<string>("");

  // Refs to track streaming state
  const accumulatedTextRef = useRef<string>("");
  const currentAgentRef = useRef<string>("");

  // Connection manager instance
  const connectionManager = useRef<StreamingConnectionManager | null>(null);

  // Initialize connection manager if not already created
  if (connectionManager.current === null) {
    connectionManager.current = new StreamingConnectionManager({
      retryFn,
      endpoint: "/api/run_sse",
    });
  }

  // Start streaming operation
  const startStream = useCallback(
    async (
      apiPayload: { message: string; userId: string; sessionId: string },
      onMessageUpdate: (message: Message) => void,
      onEventUpdate: (messageId: string, event: ProcessedEvent) => void,
      onWebsiteCountUpdate: (count: number) => void
    ): Promise<void> => {
      if (!connectionManager.current) {
        throw new Error("Connection manager not initialized");
      }

      // Generate AI message ID (frontend generates ID for streaming correlation)
      const aiMessageId = uuidv4();

      // Create callbacks object for the connection manager
      const callbacks: StreamProcessingCallbacks = {
        onMessageUpdate,
        onEventUpdate,
        onWebsiteCountUpdate,
      };

      // Convert to internal payload format
      const streamingPayload: StreamingAPIPayload = {
        message: apiPayload.message,
        userId: apiPayload.userId,
        sessionId: apiPayload.sessionId,
      };

      // Delegate to connection manager
      await connectionManager.current.submitMessage(
        streamingPayload,
        callbacks,
        accumulatedTextRef,
        currentAgentRef,
        setCurrentAgent,
        setIsLoading,
        aiMessageId
      );
    },
    []
  );

  const getEventTitleCallback = useCallback((agentName: string): string => {
    return getEventTitle(agentName);
  }, []);

  return {
    // State
    isLoading,
    currentAgent,

    // Operations
    startStream,

    // Utilities
    getEventTitle: getEventTitleCallback,
  };
}
