"use server";

import { getSessionWithEvents } from "@/lib/session-history";
import { convertAdkEventsToMessages } from "@/lib/message-converter";
import type { Message } from "@/types";
import type { ProcessedEvent } from "@/components/ActivityTimeline";

/**
 * Server Action for loading session history
 * This keeps Google Auth Library on the server side and returns processed data to client
 */

export interface SessionHistoryResult {
  success: boolean;
  messages: Message[];
  messageEvents: Map<string, ProcessedEvent[]>;
  error?: string;
}

export async function loadSessionHistoryAction(
  userId: string,
  sessionId: string
): Promise<SessionHistoryResult> {
  try {
    console.log("🔄 [SESSION_HISTORY_ACTION] Loading session history:", {
      userId,
      sessionId,
    });

    // Fetch session with events from ADK backend (server-side)
    const sessionWithEvents = await getSessionWithEvents(userId, sessionId);

    if (!sessionWithEvents) {
      console.log("⚠️ [SESSION_HISTORY_ACTION] Session not found");
      return {
        success: true,
        messages: [],
        messageEvents: new Map(),
      };
    }

    console.log("📦 [SESSION_HISTORY_ACTION] Session history loaded:", {
      sessionId: sessionWithEvents.id,
      eventsCount: sessionWithEvents.events?.length || 0,
    });

    // Convert ADK events to frontend messages
    const { messages: historicalMessages, timelineActivities } =
      convertAdkEventsToMessages(sessionWithEvents.events || []);

    console.log("✅ [SESSION_HISTORY_ACTION] Historical messages converted:", {
      messagesCount: historicalMessages.length,
      timelineActivitiesCount: timelineActivities.length,
    });

    // Process timeline events for messages that have them
    const messageEvents = new Map<string, ProcessedEvent[]>();
    historicalMessages.forEach((message) => {
      if (message.timelineActivities && message.timelineActivities.length > 0) {
        // Convert timeline activities to ProcessedEvent format
        const processedEvents: ProcessedEvent[] =
          message.timelineActivities.map((activity) => {
            // For thinking activities, extract metadata content to match real-time streaming format
            if (
              activity.metadata &&
              typeof activity.metadata === "object" &&
              "type" in activity.metadata &&
              activity.metadata.type === "thinking"
            ) {
              return {
                title: activity.title,
                data: {
                  type: "thinking",
                  content: activity.metadata.content || "",
                },
              };
            }

            // For other activities, use the existing format
            return {
              title: activity.title,
              data: {
                type: activity.type,
                agent: activity.agent,
                timestamp: activity.timestamp,
                metadata: activity.metadata,
              },
            };
          });
        messageEvents.set(message.id, processedEvents);
      }
    });

    console.log(
      "✅ [SESSION_HISTORY_ACTION] Session history loaded successfully"
    );

    return {
      success: true,
      messages: historicalMessages as Message[],
      messageEvents,
    };
  } catch (error) {
    console.error(
      "❌ [SESSION_HISTORY_ACTION] Error loading session history:",
      error
    );
    return {
      success: false,
      messages: [],
      messageEvents: new Map(),
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
