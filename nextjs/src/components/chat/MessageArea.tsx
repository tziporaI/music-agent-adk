"use client";

import { useState } from "react";

import { MessageList } from "@/components/chat/MessageList";
import { useChatContext } from "@/components/chat/ChatProvider";
import {
  SessionHistory,
  SessionHistoryPlaceholder,
} from "@/components/chat/SessionHistory";

/**
 * MessageArea - Message display and interaction logic
 * Extracted from ChatMessagesView message display section
 * Handles message list rendering, copy functionality, and loading states
 */
export function MessageArea(): React.JSX.Element {
  const {
    messages,
    messageEvents,
    isLoading,
    isLoadingHistory,
    userId,
    sessionId,
    scrollAreaRef,
  } = useChatContext();

  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const handleCopy = async (text: string, messageId: string): Promise<void> => {
    await navigator.clipboard.writeText(text);
    setCopiedMessageId(messageId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Session History Loading States */}
      <SessionHistory
        isLoadingHistory={isLoadingHistory}
        hasMessages={messages.length > 0}
        sessionId={sessionId}
        userId={userId}
      />

      {/* Session History Placeholder */}
      <SessionHistoryPlaceholder
        isLoadingHistory={isLoadingHistory}
        hasMessages={messages.length > 0}
        sessionId={sessionId}
      />

      {/* Message List */}
      <MessageList
        messages={messages}
        messageEvents={messageEvents}
        isLoading={isLoading}
        onCopy={handleCopy}
        copiedMessageId={copiedMessageId}
        scrollAreaRef={scrollAreaRef}
      />
    </div>
  );
}
