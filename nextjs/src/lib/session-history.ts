import {
  getEndpointForPath,
  getAuthHeaders,
  shouldUseAgentEngine,
} from "@/lib/config";
import type {
  AdkSession,
  AdkSessionWithEvents,
  ListSessionsResponse,
  ListEventsResponse,
} from "@/lib/types/adk";

/**
 * Raw session shape returned from Agent Engine / backend
 * (before normalization)
 */
type RawAdkSession = {
  name?: string;
  createTime?: string;
  updateTime?: string;
  userId?: string;
  [key: string]: unknown;
};

/**
 * Gets the ADK app name from environment or defaults
 */
function getAdkAppName(): string {
  return process.env.ADK_APP_NAME || "app";
}

/**
 * ADK Session Service
 */
export class AdkSessionService {
  /**
   * Retrieves a specific session by ID
   */
  static async getSession(
    userId: string,
    sessionId: string
  ): Promise<AdkSession | null> {
    const appName = getAdkAppName();

    if (shouldUseAgentEngine()) {
      const endpoint = getEndpointForPath(`/${sessionId}`, "sessions");

      try {
        const authHeaders = await getAuthHeaders();
        const response = await fetch(endpoint, {
          method: "GET",
          headers: { ...authHeaders },
        });

        if (response.status === 404) return null;
        if (!response.ok) {
          throw new Error(`Failed to get session: ${response.statusText}`);
        }

        return response.json();
      } catch (error) {
        console.error(
          "❌ [ADK SESSION SERVICE] Agent Engine getSession error:",
          error
        );
        throw error;
      }
    }

    // Local backend
    const endpoint = getEndpointForPath(
      `/apps/${appName}/users/${userId}/sessions/${sessionId}`
    );

    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch(endpoint, {
        method: "GET",
        headers: { ...authHeaders },
      });

      if (response.status === 404) return null;
      if (!response.ok) {
        throw new Error(`Failed to get session: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error(
        "❌ [ADK SESSION SERVICE] Local Backend getSession error:",
        error
      );
      throw error;
    }
  }

  /**
   * Lists all sessions for a user
   */
  static async listSessions(userId: string): Promise<ListSessionsResponse> {
    const appName = getAdkAppName();

    // 🔹 Agent Engine
    if (shouldUseAgentEngine()) {
      const filter = encodeURIComponent(`user_id="${userId}"`);
      const endpoint = getEndpointForPath(`?filter=${filter}`, "sessions");

      try {
        const authHeaders = await getAuthHeaders();
        const response = await fetch(endpoint, {
          method: "GET",
          headers: { ...authHeaders },
        });

        if (!response.ok) {
          throw new Error(`Failed to list sessions: ${response.statusText}`);
        }

        const responseData: unknown = await response.json();

        const rawSessions: RawAdkSession[] =
          (Array.isArray((responseData as { sessions?: unknown[] })?.sessions) &&
            ((responseData as { sessions: unknown[] }).sessions as RawAdkSession[])) ||
          (Array.isArray(responseData) &&
            (responseData as RawAdkSession[])) ||
          [];

        const sessions: AdkSession[] = rawSessions.map(
          (session: RawAdkSession) => {
            const sessionName = session.name;
            const sessionId =
              sessionName && sessionName.includes("/sessions/")
                ? sessionName.split("/sessions/")[1]
                : sessionName ?? "";

            return {
              id: sessionId,
              app_name: appName,
              user_id: session.userId ?? userId,
              state: null,
              last_update_time: session.updateTime ?? session.createTime ?? null,
              name: session.name,
              createTime: session.createTime,
              updateTime: session.updateTime,
            };
          }
        );

        return {
          sessions,
          sessionIds: sessions.map((s) => s.id),
        };
      } catch (error) {
        console.error(
          "❌ [ADK SESSION SERVICE] Agent Engine listSessions error:",
          error
        );
        throw error;
      }
    }

    // 🔹 Local Backend
    const endpoint = getEndpointForPath(
      `/apps/${appName}/users/${userId}/sessions`
    );

    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch(endpoint, {
        method: "GET",
        headers: { ...authHeaders },
      });

      if (!response.ok) {
        throw new Error(`Failed to list sessions: ${response.statusText}`);
      }

      const responseData = await response.json();

      const sessions =
        (Array.isArray(responseData?.sessions) && responseData.sessions) ||
        (Array.isArray(responseData) && responseData) ||
        [];

      return {
        sessions,
        sessionIds: sessions.map((s: AdkSession) => s.id),
      };
    } catch (error) {
      console.error(
        "❌ [ADK SESSION SERVICE] Local Backend listSessions error:",
        error
      );
      throw error;
    }
  }

  /**
   * Lists all events for a specific session
   */
  static async listEvents(
    userId: string,
    sessionId: string
  ): Promise<ListEventsResponse> {
    const appName = getAdkAppName();

    if (shouldUseAgentEngine()) {
      const endpoint = getEndpointForPath(`/${sessionId}/events`, "sessions");

      try {
        const authHeaders = await getAuthHeaders();
        const response = await fetch(endpoint, {
          method: "GET",
          headers: { ...authHeaders },
        });

        if (!response.ok) {
          throw new Error(`Failed to list events: ${response.statusText}`);
        }

        const responseData = await response.json();

        if (
          responseData &&
          Array.isArray(responseData.sessionEvents)
        ) {
          return {
            events: responseData.sessionEvents,
            nextPageToken: responseData.nextPageToken,
          };
        }

        return responseData;
      } catch (error) {
        console.error(
          "❌ [ADK SESSION SERVICE] Agent Engine listEvents error:",
          error
        );
        throw error;
      }
    }

    // Local backend
    const endpoint = getEndpointForPath(
      `/apps/${appName}/users/${userId}/sessions/${sessionId}/events`
    );

    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch(endpoint, {
        method: "GET",
        headers: { ...authHeaders },
      });

      if (!response.ok) {
        throw new Error(`Failed to list events: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error(
        "❌ [ADK SESSION SERVICE] Local Backend listEvents error:",
        error
      );
      throw error;
    }
  }

  /**
   * Retrieves a session with all its events
   */
  static async getSessionWithEvents(
    userId: string,
    sessionId: string
  ): Promise<AdkSessionWithEvents | null> {
    try {
      if (shouldUseAgentEngine()) {
        const eventsResponse = await AdkSessionService.listEvents(
          userId,
          sessionId
        );

        return {
          id: sessionId,
          user_id: userId,
          app_name: getAdkAppName(),
          state: null,
          last_update_time: new Date().toISOString(),
          events: eventsResponse?.events || [],
        };
      }

      const session = await AdkSessionService.getSession(userId, sessionId);
      if (!session) return null;

      return {
        ...session,
        events: session.events || [],
      };
    } catch (error) {
      console.error(
        "❌ [ADK SESSION SERVICE] Error fetching session with events:",
        error
      );
      throw error;
    }
  }
}

/**
 * Convenience exports
 */
export async function getSessionWithEvents(
  userId: string,
  sessionId: string
): Promise<AdkSessionWithEvents | null> {
  return AdkSessionService.getSessionWithEvents(userId, sessionId);
}

export async function listUserSessions(
  userId: string
): Promise<ListSessionsResponse> {
  return AdkSessionService.listSessions(userId);
}
