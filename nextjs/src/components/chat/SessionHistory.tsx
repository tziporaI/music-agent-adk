"use client";

import { Loader2, MessageCircle, AlertCircle } from "lucide-react";

/**
 * SessionHistory - Loading states and messages for session history functionality
 * Displays appropriate loading, success, and error states for session history loading
 */

interface SessionHistoryProps {
  isLoadingHistory: boolean;
  hasMessages: boolean;
  sessionId: string;
  userId: string;
  error?: string | null;
}

export function SessionHistory({
  isLoadingHistory,
  sessionId,
  error,
}: SessionHistoryProps): React.JSX.Element | null {
  // Don't render if not loading and no error
  if (!isLoadingHistory && !error) {
    return null;
  }

  // Loading state
  if (isLoadingHistory) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              Loading conversation history...
            </span>
            <span className="text-xs opacity-70">
              Fetching messages for session {sessionId.substring(0, 8)}...
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center gap-3 text-red-400">
          <AlertCircle className="h-5 w-5" />
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              Failed to load conversation history
            </span>
            <span className="text-xs opacity-70">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

/**
 * SessionHistoryPlaceholder - Shows when no messages are found but loading completed
 */
interface SessionHistoryPlaceholderProps {
  isLoadingHistory: boolean;
  hasMessages: boolean;
  sessionId: string;
}

export function SessionHistoryPlaceholder({
  isLoadingHistory,
  hasMessages,
}: SessionHistoryPlaceholderProps): React.JSX.Element | null {
  // Only show when not loading and no messages
  if (isLoadingHistory || hasMessages) {
    return null;
  }

  return (
    <div className="flex items-center justify-center py-8 text-slate-500">
      <div className="flex items-center gap-3">
        <MessageCircle className="h-5 w-5" />
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            No conversation history found
          </span>
          <span className="text-xs opacity-70">
            This session is ready for new messages
          </span>
        </div>
      </div>
    </div>
  );
}
