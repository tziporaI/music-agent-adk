import { useState, useCallback } from "react";
import { Message } from "@/types";
import { ProcessedEvent } from "@/components/ActivityTimeline";

export interface UseMessagesReturn {
  // State
  messages: Message[];
  messageEvents: Map<string, ProcessedEvent[]>;
  websiteCount: number;

  // Message operations
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, content: string) => void;
  clearMessages: () => void;
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;

  // Event operations
  addMessageEvent: (messageId: string, event: ProcessedEvent) => void;
  clearMessageEvents: () => void;
  setMessageEvents: (
    events:
      | Map<string, ProcessedEvent[]>
      | ((prev: Map<string, ProcessedEvent[]>) => Map<string, ProcessedEvent[]>)
  ) => void;

  // Website count for research tracking
  updateWebsiteCount: (count: number) => void;

  // Persistence
  saveMessagesToStorage: (
    userId: string,
    sessionId: string,
    messages: Message[]
  ) => void;
  loadMessagesFromStorage: (userId: string, sessionId: string) => Message[];
}

/**
 * Custom hook for managing chat messages, events, and persistence
 */
export function useMessages(): UseMessagesReturn {
  const [messages, setMessagesState] = useState<Message[]>([]);
  const [messageEvents, setMessageEventsState] = useState<
    Map<string, ProcessedEvent[]>
  >(new Map());
  const [websiteCount, setWebsiteCount] = useState<number>(0);

  // Messages storage key for localStorage
  const getMessagesStorageKey = useCallback(
    (userId: string, sessionId: string): string =>
      `chat_messages_${userId}_${sessionId}`,
    []
  );

  // Load messages for a specific session
  const loadMessagesFromStorage = useCallback(
    (userId: string, sessionId: string): Message[] => {
      try {
        const stored = localStorage.getItem(
          getMessagesStorageKey(userId, sessionId)
        );
        if (stored) {
          const parsedMessages = JSON.parse(stored);
          // Convert timestamp strings back to Date objects
          return parsedMessages.map((msg: Message) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          }));
        }
        return [];
      } catch (error) {
        console.error("Error loading messages from storage:", error);
        return [];
      }
    },
    [getMessagesStorageKey]
  );

  // Save messages for a specific session
  const saveMessagesToStorage = useCallback(
    (userId: string, sessionId: string, messages: Message[]): void => {
      try {
        localStorage.setItem(
          getMessagesStorageKey(userId, sessionId),
          JSON.stringify(messages)
        );
      } catch (error) {
        console.error("Error saving messages to storage:", error);
      }
    },
    [getMessagesStorageKey]
  );

  // Add a new message
  const addMessage = useCallback((message: Message): void => {
    setMessagesState((prev) => [...prev, message]);
  }, []);

  // Update an existing message by ID
  const updateMessage = useCallback(
    (messageId: string, content: string): void => {
      setMessagesState((prev) =>
        prev.map((msg) => (msg.id === messageId ? { ...msg, content } : msg))
      );
    },
    []
  );

  // Clear all messages
  const clearMessages = useCallback((): void => {
    setMessagesState([]);
  }, []);

  // Set messages with function support
  const setMessages = useCallback(
    (messagesOrUpdater: Message[] | ((prev: Message[]) => Message[])): void => {
      setMessagesState(messagesOrUpdater);
    },
    []
  );

  // Add an event to a specific message
  const addMessageEvent = useCallback(
    (messageId: string, event: ProcessedEvent): void => {
      setMessageEventsState((prev) => {
        const newMap = new Map(prev);
        const existingEvents = newMap.get(messageId) || [];
        newMap.set(messageId, [...existingEvents, event]);
        return newMap;
      });
    },
    []
  );

  // Clear all message events
  const clearMessageEvents = useCallback((): void => {
    setMessageEventsState(new Map());
  }, []);

  // Set message events with function support
  const setMessageEvents = useCallback(
    (
      eventsOrUpdater:
        | Map<string, ProcessedEvent[]>
        | ((
            prev: Map<string, ProcessedEvent[]>
          ) => Map<string, ProcessedEvent[]>)
    ): void => {
      setMessageEventsState(eventsOrUpdater);
    },
    []
  );

  // Update website count (for research tracking)
  const updateWebsiteCount = useCallback((count: number): void => {
    setWebsiteCount((prev) => Math.max(prev, count));
  }, []);

  return {
    // State
    messages,
    messageEvents,
    websiteCount,

    // Message operations
    addMessage,
    updateMessage,
    clearMessages,
    setMessages,

    // Event operations
    addMessageEvent,
    clearMessageEvents,
    setMessageEvents,

    // Website count
    updateWebsiteCount,

    // Persistence
    saveMessagesToStorage,
    loadMessagesFromStorage,
  };
}
