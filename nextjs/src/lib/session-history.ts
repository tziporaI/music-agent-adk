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
 * ADK Session History Service - Handles session and event retrieval for chat history
 * Simplified approach using smart endpoint routing (like web project)
 *
 * This service provides:
 * - Session retrieval by ID
 * - Event listing for sessions
 * - Combined session + events for historical loading
 * - Support for both Agent Engine and Local Backend deployments
 */

/**
 * Gets the ADK app name from environment or defaults
 */
function getAdkAppName(): string {
  return process.env.ADK_APP_NAME || "app";
}

/**
 * ADK Session Service - Handles all session-related API calls
 * Uses smart endpoint routing to work with both local backend and Agent Engine
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
      // Agent Engine: Use v1beta1 sessions API
      const endpoint = getEndpointForPath(`/${sessionId}`, "sessions");

      try {
        const authHeaders = await getAuthHeaders();
        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            ...authHeaders,
          },
        });

        if (response.status === 404) {
          return null;
        }

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
    } else {
      // Local Backend: GET with path
      const endpoint = getEndpointForPath(
        `/apps/${appName}/users/${userId}/sessions/${sessionId}`
      );

      try {
        const authHeaders = await getAuthHeaders();
        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            ...authHeaders,
          },
        });

        if (response.status === 404) {
          return null;
        }

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
  }

  /**
   * Lists all sessions for a user
   */
   /**
   * Lists all sessions for a user
   */
  static async listSessions(userId: string): Promise<ListSessionsResponse> {
    const appName = getAdkAppName();

    // 🔹 Agent Engine
    if (shouldUseAgentEngine()) {
      // Agent Engine: Use v1beta1 sessions API עם פילטר לפי user_id
      const filter = encodeURIComponent(`user_id="${userId}"`);
      const endpoint = getEndpointForPath(`?filter=${filter}`, "sessions");

      console.log(
        "🔗 [ADK SESSION SERVICE] Agent Engine listSessions request:",
        {
          endpoint,
          method: "GET",
          userId,
        }
      );

      try {
        const authHeaders = await getAuthHeaders();
        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            ...authHeaders,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to list sessions: ${response.statusText}`);
        }

        const responseData = await response.json();

        // נוודא שתמיד עובדים עם מערך
        const rawSessions =
          (Array.isArray(responseData?.sessions) && responseData.sessions) ||
          (Array.isArray(responseData) && responseData) ||
          [];

        const sessions: AdkSession[] = (rawSessions as any[]).map(
          (session: {
            name?: string;
            createTime?: string;
            updateTime?: string;
            userId?: string;
            [key: string]: any;
          }) => {
            // Extract session ID from name field: "projects/.../sessions/SESSION_ID"
            const sessionName = session.name;
            const sessionId =
              sessionName && sessionName.includes("/sessions/")
                ? sessionName.split("/sessions/")[1]
                : sessionName ?? "";

            return {
              id: sessionId,
              app_name: appName, // לשמירה על התאמה לטייפ
              user_id: session.userId ?? userId,
              state: null,
              last_update_time: session.updateTime || session.createTime,
              // נשמור את השדות המקוריים לדיבוג / שימוש עתידי
              name: session.name,
              createTime: session.createTime,
              updateTime: session.updateTime,
            } as AdkSession;
          }
        );

        return {
          sessions,
          sessionIds: sessions.map((session) => session.id),
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
    else {
      // Local Backend: GET עם userId במסלול – רק סשנים של המשתמש
      const endpoint = getEndpointForPath(
        `/apps/${appName}/users/${userId}/sessions`
      );

      console.log(
        "🔗 [ADK SESSION SERVICE] Local Backend listSessions request:",
        {
          endpoint,
          method: "GET",
          userId,
          appName,
        }
      );

      try {
        const authHeaders = await getAuthHeaders();
        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            ...authHeaders,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to list sessions: ${response.statusText}`);
        }

        const responseData = await response.json();

        // גם כאן נוודא שתמיד יש מערך
        const rawSessions =
          (Array.isArray(responseData?.sessions) && responseData.sessions) ||
          (Array.isArray(responseData) && responseData) ||
          [];

        const sessions: AdkSession[] = rawSessions as AdkSession[];

        return {
          sessions,
          sessionIds: sessions.map((session) => session.id),
        };
      } catch (error) {
        console.error(
          "❌ [ADK SESSION SERVICE] Local Backend listSessions error:",
          error
        );
        throw error;
      }
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
      // Agent Engine: Use v1beta1 sessions API
      const endpoint = getEndpointForPath(`/${sessionId}/events`, "sessions");

      try {
        const authHeaders = await getAuthHeaders();
        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            ...authHeaders,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to list events: ${response.statusText}`);
        }

        const responseData = await response.json();

        // Agent Engine returns events in 'sessionEvents' field, but we need 'events'
        if (
          responseData &&
          responseData.sessionEvents &&
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
    } else {
      // Local Backend: GET with path
      const endpoint = getEndpointForPath(
        `/apps/${appName}/users/${userId}/sessions/${sessionId}/events`
      );

      try {
        const authHeaders = await getAuthHeaders();
        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            ...authHeaders,
          },
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
  }

  /**
   * Retrieves a session with all its events (for historical context)
   */
  static async getSessionWithEvents(
    userId: string,
    sessionId: string
  ): Promise<AdkSessionWithEvents | null> {
    try {
      if (shouldUseAgentEngine()) {
        // For Agent Engine, get events directly from the /events endpoint
        const eventsResponse = await AdkSessionService.listEvents(
          userId,
          sessionId
        );
        const events = eventsResponse?.events || [];

        // Create a minimal session object with the events
        const session: AdkSessionWithEvents = {
          id: sessionId,
          user_id: userId,
          app_name: process.env.ADK_APP_NAME || "app",
          state: null,
          last_update_time: new Date().toISOString(),
          events: events,
        };

        return session;
      } else {
        // Local backend - fetch session only (backend includes events in session detail)
        const session = await AdkSessionService.getSession(userId, sessionId);

        if (!session) {
          return null;
        }

        // Use events directly from session detail (backend includes them)
        const events = session.events || [];

        return {
          ...session,
          events,
        };
      }
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
 * Convenience functions that use the AdkSessionService
 */
export async function getSessionWithEvents(
  userId: string,
  sessionId: string
): Promise<AdkSessionWithEvents | null> {
  return await AdkSessionService.getSessionWithEvents(userId, sessionId);
}

export async function listUserSessions(
  userId: string
): Promise<ListSessionsResponse> {
  return await AdkSessionService.listSessions(userId);
}
