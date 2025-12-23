"use client";

import { MessageItem } from "./MessageItem";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Loader2 } from "lucide-react";
import { Message } from "@/types";
import { ProcessedEvent } from "@/components/ActivityTimeline";

interface MessageListProps {
  messages: Message[];
  messageEvents?: Map<string, ProcessedEvent[]>;
  isLoading?: boolean;
  onCopy?: (text: string, messageId: string) => void;
  copiedMessageId?: string | null;
  scrollAreaRef?: React.RefObject<HTMLDivElement | null>;
}

/**
 * Message list component that efficiently renders all messages
 * with proper scrolling and performance optimization
 */
export function MessageList({
  messages,
  messageEvents,
  isLoading = false,
  onCopy,
  copiedMessageId,
  scrollAreaRef,
}: MessageListProps) {
  // If no messages, show empty state
  if (messages.length === 0) {
    return (
      <ScrollArea ref={scrollAreaRef} className="flex-1 px-4 py-6">
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-3">
            <div className="text-slate-500 text-lg">💬</div>
            <p className="text-slate-400 text-sm">
              No messages yet. Start a conversation!
            </p>
          </div>
        </div>
      </ScrollArea>
    );
  }

  return (
    <ScrollArea ref={scrollAreaRef} className="flex-1 px-4 py-6">
      <div className="space-y-6 max-w-4xl mx-auto w-full">
        {messages.map((message, index) => (
          <MessageItem
            key={message.id}
            message={message}
            messageEvents={messageEvents}
            // Only show loading for the last message
            isLoading={isLoading && index === messages.length - 1}
            onCopy={onCopy}
            copiedMessageId={copiedMessageId}
          />
        ))}

        {/* Show "Planning..." if the last message is human and we are loading */}
        {isLoading &&
          messages.length > 0 &&
          messages[messages.length - 1].type === "human" && (
            <div className="flex items-start gap-3 max-w-[90%]">
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center shadow-md border border-emerald-400/30">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-2xl rounded-tl-sm p-4 shadow-lg">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                  <span className="text-sm text-slate-400">
                    Planning your goal...
                  </span>
                </div>
              </div>
            </div>
          )}
      </div>
    </ScrollArea>
  );
}
