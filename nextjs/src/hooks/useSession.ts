import { useState, useCallback } from "react";

export interface UseSessionReturn {
  sessionId: string;
  userId: string;

  handleUserIdChange: (newUserId: string) => void;
  handleUserIdConfirm: (confirmedUserId: string) => void;

  handleSessionSwitch: (newSessionId: string) => void;
  handleCreateNewSession: (sessionUserId: string) => Promise<void>;
}

export function useSession(): UseSessionReturn {
  const [sessionId, setSessionId] = useState<string>("");
  const [userId, setUserId] = useState<string>("");

  const handleSessionSwitch = useCallback(
    (newSessionId: string): void => {
      if (!userId || newSessionId === sessionId) return;
      setSessionId(newSessionId);
    },
    [userId, sessionId]
  );

  const handleCreateNewSession = useCallback(
    async (sessionUserId: string): Promise<void> => {
      if (!sessionUserId) {
        throw new Error("User ID is required to create a session");
      }

      const { createSessionAction } = await import(
        "@/lib/actions/session-actions"
      );

      const sessionResult = await createSessionAction(sessionUserId);

      if (!sessionResult.success || !sessionResult.sessionId) {
        throw new Error("Session creation failed");
      }

      handleSessionSwitch(sessionResult.sessionId);
    },
    [handleSessionSwitch]
  );

  const handleUserIdChange = useCallback((newUserId: string): void => {
    setUserId(newUserId);
  }, []);

  const handleUserIdConfirm = useCallback((confirmedUserId: string): void => {
    setUserId(confirmedUserId);
  }, []);

  return {
    sessionId,
    userId,
    handleUserIdChange,
    handleUserIdConfirm,
    handleSessionSwitch,
    handleCreateNewSession,
  };
}
