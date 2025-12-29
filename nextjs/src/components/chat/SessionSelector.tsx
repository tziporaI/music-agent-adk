"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageSquare,
  Calendar,
  Loader2,
  Plus,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { fetchActiveSessionsAction } from "@/lib/actions/session-list-actions";

interface Session {
  id: string;
  userId: string;
  lastActivity: Date;
  title?: string;
  messageCount?: number;
}

interface SessionSelectorProps {
  currentUserId: string;
  currentSessionId: string;
  onSessionSelect: (sessionId: string) => void;
  onCreateSession: (userId: string) => Promise<void>;
  className?: string;
}

export function SessionSelector({
  currentUserId,
  currentSessionId,
  onSessionSelect,
  onCreateSession,
  className = "",
}: SessionSelectorProps): React.JSX.Element {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const fetchActiveSessions = useCallback(async (userId: string) => {
    try {
      setIsLoadingSessions(true);
      setSessionError(null);

      const result = await fetchActiveSessionsAction(userId);

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch sessions");
      }

      const activeSessions: Session[] = result.sessions.map((session) => ({
        id: session.id,
        userId: session.userId,
        lastActivity: session.lastUpdateTime || new Date(),
        title: session.title || `Session ${session.id.substring(0, 8)}`,
        messageCount: session.messageCount,
      }));

      activeSessions.sort(
        (a, b) => b.lastActivity.getTime() - a.lastActivity.getTime()
      );

      setSessions(activeSessions);
    } catch (error) {
      console.error("❌ Failed to fetch sessions:", error);
      setSessionError("Failed to load sessions");
      setSessions([]);

      toast.error("Failed to load sessions");
    } finally {
      setIsLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchActiveSessions(currentUserId);
    } else {
      setSessions([]);
      setSessionError(null);
    }
  }, [currentUserId, fetchActiveSessions]);

  useEffect(() => {
    if (currentSessionId && currentUserId) {
      setSessions((prev) => {
        const exists = prev.some((s) => s.id === currentSessionId);
        if (exists) return prev;

        return [
          {
            id: currentSessionId,
            userId: currentUserId,
            lastActivity: new Date(),
            title: `Session ${currentSessionId.substring(0, 8)}`,
            messageCount: 0,
          },
          ...prev,
        ];
      });
    }
  }, [currentSessionId, currentUserId]);

  const handleSessionSelect = async (value: string): Promise<void> => {
    if (value === "create-new") {
      setIsCreatingSession(true);
      try {
        await onCreateSession(currentUserId);
        setTimeout(() => fetchActiveSessions(currentUserId), 500);
      } catch {
        toast.error("Failed to create session");
      } finally {
        setIsCreatingSession(false);
      }
    } else {
      onSessionSelect(value);
    }
  };

  const formatDate = (date: Date): string => {
    const diff = Math.floor((Date.now() - date.getTime()) / 60000);
    if (diff < 1) return "Just now";
    if (diff < 60) return `${diff}m ago`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className={className}>
      {!currentUserId ? (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <MessageSquare className="w-4 h-4" />
          <span>No user set</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Session:</span>

          <Select value={currentSessionId} onValueChange={handleSessionSelect}>
            <SelectTrigger className="w-44 h-12 text-xs bg-slate-700/50 border-slate-600/50 text-slate-100">
              <SelectValue
                placeholder={
                  isLoadingSessions
                    ? "Loading..."
                    : sessionError
                    ? "Error"
                    : sessions.length === 0
                    ? "Create first session"
                    : "Select session"
                }
              />
            </SelectTrigger>

            <SelectContent className="bg-slate-800 border-slate-600 min-w-44">
              {isLoadingSessions && (
                <div className="flex items-center gap-2 p-3 text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading sessions...
                </div>
              )}

              {sessionError && !isLoadingSessions && (
                <div className="flex items-center gap-2 p-3 text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  Failed to load sessions
                </div>
              )}

              {!isLoadingSessions && !sessionError && (
                <>
                  {/* 🔽 SCROLLABLE SESSIONS */}
                  <div className="max-h-64 overflow-y-auto">
                    {sessions.map((session) => (
                      <SelectItem
                        key={session.id}
                        value={session.id}
                        className="py-3 px-3 text-slate-100 focus:bg-slate-700"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium text-sm truncate">
                            {session.title}
                          </span>
                          <div className="flex items-center gap-2 text-xs text-slate-300 mt-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(session.lastActivity)}
                            {session.messageCount !== undefined && (
                              <>
                                <span className="text-slate-500">•</span>
                                {session.messageCount} msg
                              </>
                            )}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </div>

                  {/* ➕ CREATE SESSION (ALWAYS VISIBLE) */}
                  <SelectItem
                    value="create-new"
                    disabled={isCreatingSession}
                    className="border-t border-slate-600 mt-1 py-3 px-3 text-emerald-400"
                  >
                    <div className="flex items-center gap-2">
                      {isCreatingSession ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                      {isCreatingSession ? "Creating..." : "Create New Session"}
                    </div>
                  </SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
