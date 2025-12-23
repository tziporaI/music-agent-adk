"use client";

import { EmptyState } from "@/components/chat/EmptyState";
import { MessageArea } from "@/components/chat/MessageArea";
import { useChatContext } from "@/components/chat/ChatProvider";

/**
 * ChatContent - Conditional rendering container
 * Shows EmptyState when no messages exist, MessageArea when messages are present
 * Handles the conditional logic that was in ChatMessagesView
 */
export function ChatContent(): React.JSX.Element {
  const { messages } = useChatContext();

  return (
    <div className={`h-full ${messages.length === 0 ? "flex" : ""}`}>
      {messages.length === 0 ? <EmptyState /> : <MessageArea />}
    </div>
  );
}
