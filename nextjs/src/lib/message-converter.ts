import type {
  AdkEvent,
  ConversionResult,
  TimelineActivity,
  Message as AdkMessage,
} from "@/lib/types/adk";
import type { Message as BaseMessage } from "@/types";

/**
 * Message Converter - Transforms ADK events into frontend message format
 * Ported from web project and adapted for nextjs project architecture
 *
 * This converter handles:
 * - ADK event extraction and text parsing
 * - Timeline activity reconstruction
 * - Message chronological ordering
 * - Role mapping (ADK "user"/"model" → frontend "human"/"ai")
 */

/**
 * Interface for ADK event content parts structure
 */
interface AdkEventPart {
  video_metadata?: unknown;
  thought?: boolean; // Changed from unknown to boolean to match real-time streaming
  inline_data?: unknown;
  file_data?: unknown;
  thought_signature?: unknown;
  code_execution_result?: unknown;
  executable_code?: unknown;
  function_call?: unknown;
  function_response?: unknown;
  text?: string;
}

/**
 * Extracts NON-THOUGHT text content from an ADK event (matches real-time streaming logic)
 * Filters out thought parts to avoid mixing thoughts with regular message content
 */
function extractTextFromAdkEvent(event: AdkEvent): string {
  console.log(`🔍 [EXTRACT_TEXT] Processing event ${event.id}:`, {
    contentType: typeof event.content,
    hasContent: !!event.content,
  });

  // Handle case where content is a JSON string
  if (typeof event.content === "string") {
    try {
      const parsed = JSON.parse(event.content);
      console.log(`📦 [EXTRACT_TEXT] Parsed JSON content:`, {
        hasParts: !!parsed.parts,
        partsLength: parsed.parts?.length || 0,
      });

      if (parsed.parts && Array.isArray(parsed.parts)) {
        // MATCH REAL-TIME STREAMING: Filter out thought parts (part.thought === true)
        const texts = parsed.parts
          .filter((part: AdkEventPart) => {
            // Only include parts with text that are NOT thoughts
            return (
              part && typeof part === "object" && part.text && !part.thought
            );
          })
          .map((part: AdkEventPart) => part.text!)
          .filter((text: string) => text && text.trim().length > 0);

        const result = texts.join(" ");
        console.log(`✅ [EXTRACT_TEXT] Extracted NON-THOUGHT text from JSON:`, {
          partsCount: parsed.parts.length,
          nonThoughtTextParts: texts.length,
          resultLength: result.length,
        });
        return result;
      }
    } catch (error) {
      console.warn(`⚠️ [EXTRACT_TEXT] JSON parsing failed:`, error);
      // If JSON parsing fails, return the string as-is
      return event.content;
    }
  }

  // Handle case where content is already an object with parts
  if (event.content?.parts && Array.isArray(event.content.parts)) {
    // MATCH REAL-TIME STREAMING: Filter out thought parts (part.thought === true)
    const texts = event.content.parts
      .filter((part: AdkEventPart) => {
        // Only include parts with text that are NOT thoughts
        return part && typeof part === "object" && part.text && !part.thought;
      })
      .map((part: AdkEventPart) => part.text!)
      .filter((text: string) => text && text.trim().length > 0);

    const result = texts.join(" ");
    console.log(`✅ [EXTRACT_TEXT] Extracted NON-THOUGHT text from object:`, {
      partsCount: event.content.parts.length,
      nonThoughtTextParts: texts.length,
      resultLength: result.length,
    });
    return result;
  }

  // Fallback to empty string if no text content
  console.log(
    `⚠️ [EXTRACT_TEXT] No extractable content found for event ${event.id}`
  );
  return "";
}

/**
 * Extracts THOUGHT text content from an ADK event (matches real-time streaming logic)
 * Only returns text from parts where thought === true
 */
function extractThoughtsFromAdkEvent(event: AdkEvent): string[] {
  console.log(`🧠 [EXTRACT_THOUGHTS] Processing event ${event.id}:`, {
    contentType: typeof event.content,
    hasContent: !!event.content,
  });

  // Handle case where content is a JSON string
  if (typeof event.content === "string") {
    try {
      const parsed = JSON.parse(event.content);
      if (parsed.parts && Array.isArray(parsed.parts)) {
        // MATCH REAL-TIME STREAMING: Extract only thought parts (part.thought === true)
        const thoughtTexts = parsed.parts
          .filter((part: AdkEventPart) => {
            // Only include parts with text that ARE thoughts
            return (
              part && typeof part === "object" && part.text && part.thought
            );
          })
          .map((part: AdkEventPart) => part.text!)
          .filter((text: string) => text && text.trim().length > 0);

        console.log(`✅ [EXTRACT_THOUGHTS] Extracted thoughts from JSON:`, {
          partsCount: parsed.parts.length,
          thoughtParts: thoughtTexts.length,
          thoughts: thoughtTexts,
        });
        return thoughtTexts;
      }
    } catch (error) {
      console.warn(`⚠️ [EXTRACT_THOUGHTS] JSON parsing failed:`, error);
      return [];
    }
  }

  // Handle case where content is already an object with parts
  if (event.content?.parts && Array.isArray(event.content.parts)) {
    // MATCH REAL-TIME STREAMING: Extract only thought parts (part.thought === true)
    const thoughtTexts = event.content.parts
      .filter((part: AdkEventPart) => {
        // Only include parts with text that ARE thoughts
        return part && typeof part === "object" && part.text && part.thought;
      })
      .map((part: AdkEventPart) => part.text!)
      .filter((text: string) => text && text.trim().length > 0);

    console.log(`✅ [EXTRACT_THOUGHTS] Extracted thoughts from object:`, {
      partsCount: event.content.parts.length,
      thoughtParts: thoughtTexts.length,
      thoughts: thoughtTexts,
    });
    return thoughtTexts;
  }

  // Fallback to empty array if no thought content
  console.log(
    `⚠️ [EXTRACT_THOUGHTS] No thought content found for event ${event.id}`
  );
  return [];
}

/**
 * Splits combined thought text into individual thought sections
 */
function splitThoughtsIntoSections(combinedThoughts: string): string[] {
  // Split by double newlines followed by ** (start of new thought section)
  // This preserves complete thought sections including their headers and content
  const sections = combinedThoughts.split(/\n\n(?=\*\*)/);

  return sections
    .map((section) => section.trim())
    .filter((section) => section.length > 0 && section.includes("**"));
}

/**
 * Extracts the title from a thought section (the bold header)
 * Currently unused but kept for potential future use
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function extractThoughtTitle(thoughtSection: string): string {
  // Look for **Title** pattern at the start of the section
  const match = thoughtSection.match(/^\*\*([^*]+?)\*\*/);
  return match ? `🤔 ${match[1].trim()}` : "🤔 AI Thinking";
}

/**
 * Checks if an ADK event has meaningful actions/metadata worth showing as a timeline activity
 */
function hasMeaningfulActions(event: AdkEvent): boolean {
  // Check if actions exist and have meaningful content
  if (event.actions && typeof event.actions === "object") {
    // Treat actions as a flexible Record to handle all possible properties
    const actions = event.actions as Record<string, unknown>;

    // Check each property in actions for meaningful content
    for (const [key, value] of Object.entries(actions)) {
      if (value && typeof value === "object") {
        const objectValue = value as Record<string, unknown>;
        const hasNonEmptyObject = Object.keys(objectValue).length > 0;

        // For nested objects, check if they have meaningful content
        if (hasNonEmptyObject) {
          // Check if any nested values are non-empty
          const hasNonEmptyValues = Object.values(objectValue).some(
            (nestedValue) => {
              if (nestedValue === null || nestedValue === undefined)
                return false;
              if (typeof nestedValue === "object") {
                return (
                  Object.keys(nestedValue as Record<string, unknown>).length > 0
                );
              }
              if (typeof nestedValue === "string") {
                return nestedValue.trim().length > 0;
              }
              return true; // Non-empty primitive values
            }
          );

          if (hasNonEmptyValues) {
            console.log(
              `✅ [MEANINGFUL_ACTIONS] Found meaningful content in actions.${key}:`,
              objectValue
            );
            return true;
          }
        }
      } else if (value !== null && value !== undefined) {
        // Non-object values that are not null/undefined are considered meaningful
        console.log(
          `✅ [MEANINGFUL_ACTIONS] Found meaningful primitive in actions.${key}:`,
          value
        );
        return true;
      }
    }
  }

  // Check grounding metadata
  if (event.groundingMetadata && typeof event.groundingMetadata === "object") {
    const metadataKeys = Object.keys(event.groundingMetadata);
    if (metadataKeys.length > 0) {
      console.log(
        `✅ [MEANINGFUL_ACTIONS] Found meaningful grounding metadata:`,
        event.groundingMetadata
      );
      return true;
    }
  }

  console.log(
    `⚠️ [MEANINGFUL_ACTIONS] No meaningful actions found for event ${event.id}`
  );
  return false;
}

/**
 * Reconstructs timeline activities from ADK events
 * MATCHES REAL-TIME STREAMING: Creates separate "🤔 AI Thinking" activities for each thought section
 */
function reconstructTimelineFromEvents(events: AdkEvent[]): {
  activities: TimelineActivity[];
  messageCorrelation: Record<number, TimelineActivity[]>;
} {
  const activities: TimelineActivity[] = [];
  const messageCorrelation: Record<number, TimelineActivity[]> = {};

  let messageIndex = 0;

  events.forEach((event, index) => {
    // Skip events without content
    if (!event.content) return;

    // MATCH REAL-TIME STREAMING: Check for thought parts and create separate "🤔 AI Thinking" activities
    const thoughtParts = extractThoughtsFromAdkEvent(event);
    const hasThoughts = thoughtParts.length > 0;

    if (hasThoughts) {
      // Join all thought parts first, then split into individual thought sections
      const combinedThoughts = thoughtParts.join(" ");

      console.log(`🔍 [TIMELINE] Combined thoughts for event ${event.id}:`, {
        combinedThoughts,
        length: combinedThoughts.length,
      });

      const thoughtSections = splitThoughtsIntoSections(combinedThoughts);

      console.log(`🔍 [TIMELINE] Thought sections for event ${event.id}:`, {
        sectionsCount: thoughtSections.length,
        sections: thoughtSections,
      });

      thoughtSections.forEach((section, sectionIndex) => {
        // Always use generic "AI Thinking" title, put specific content inside
        const title = "🤔 AI Thinking";

        const thoughtActivity: TimelineActivity = {
          id: `thought_${event.id}_${sectionIndex}`,
          type: "agent_action",
          agent: event.author || "assistant",
          title: title, // Always use generic thinking title
          timestamp: new Date(event.timestamp),
          metadata: {
            type: "thinking",
            content: section.trim(),
            invocationId: event.invocationId,
          },
        };

        activities.push(thoughtActivity);

        // Associate with current message index
        if (!messageCorrelation[messageIndex]) {
          messageCorrelation[messageIndex] = [];
        }
        messageCorrelation[messageIndex].push(thoughtActivity);

        console.log(
          `✅ [TIMELINE] Created thought activity ${sectionIndex + 1}/${
            thoughtSections.length
          } for event ${event.id}:`,
          {
            title: title,
            messageIndex: messageIndex,
            preview: section.substring(0, 100) + "...",
          }
        );
      });
    }

    // Create other timeline activities ONLY if there are no thought parts AND meaningful actions exist
    // This prevents duplicate activities and filters out empty/meaningless events
    if (!hasThoughts && hasMeaningfulActions(event)) {
      const activity: TimelineActivity = {
        id: `activity_${event.id}`,
        type: "agent_action",
        agent: event.author || "assistant",
        title: `Processing step ${index + 1}`,
        timestamp: new Date(event.timestamp),
        metadata: {
          invocationId: event.invocationId,
          actions: event.actions,
          groundingMetadata: event.groundingMetadata,
        },
      };

      activities.push(activity);

      // Associate with current message index
      if (!messageCorrelation[messageIndex]) {
        messageCorrelation[messageIndex] = [];
      }
      messageCorrelation[messageIndex].push(activity);

      console.log(
        `✅ [TIMELINE] Created "Processing step" activity for event ${event.id} (meaningful actions):`,
        {
          messageIndex: messageIndex,
          hasActions: !!event.actions,
          hasGroundingMetadata: !!event.groundingMetadata,
        }
      );
    } else if (!hasThoughts && (event.actions || event.groundingMetadata)) {
      console.log(
        `⚠️ [TIMELINE] Skipped "Processing step" for event ${event.id} - no meaningful content:`,
        {
          hasActions: !!event.actions,
          hasGroundingMetadata: !!event.groundingMetadata,
          actionsContent: event.actions,
        }
      );
    }

    // Increment message index for AI messages (model role)
    if (event.content.role === "model") {
      messageIndex++;
    }
  });

  return {
    activities,
    messageCorrelation,
  };
}

/**
 * Converts ADK events to Message format for the chat interface
 * Filters out events without meaningful text content and handles timeline activities
 */
export function convertAdkEventsToMessages(
  events: AdkEvent[]
): ConversionResult {
  console.log("🔄 [CONVERTER] Converting ADK events to messages:", {
    totalEvents: events.length,
    events: events.map((e) => ({
      id: e.id,
      author: e.author,
      content:
        typeof e.content === "string"
          ? (e.content as string).substring(0, 100) + "..."
          : e.content,
    })),
  });

  const messages = events
    .map((event, index) => {
      console.log(
        `🔍 [CONVERTER] Processing event ${index + 1}/${events.length}:`,
        {
          id: event.id,
          author: event.author,
          timestamp: event.timestamp,
          contentType: typeof event.content,
          contentPreview:
            typeof event.content === "string"
              ? (event.content as string).substring(0, 100) + "..."
              : event.content,
        }
      );

      const content = extractTextFromAdkEvent(event);
      console.log(`📝 [CONVERTER] Extracted content for event ${event.id}:`, {
        contentLength: content.length,
        content:
          content.substring(0, 200) + (content.length > 200 ? "..." : ""),
      });

      // Skip events without meaningful text content
      if (!content.trim()) {
        console.log(
          `⚠️ [CONVERTER] Skipping event ${event.id} - no meaningful content`
        );
        return null;
      }

      // Parse content to access role field
      let parsedContent: { role?: string } | null = null;
      if (typeof event.content === "string") {
        try {
          parsedContent = JSON.parse(event.content);
        } catch (error) {
          console.warn(
            `⚠️ [CONVERTER] Failed to parse JSON content for event ${event.id}:`,
            error
          );
          return null;
        }
      } else if (event.content && typeof event.content === "object") {
        parsedContent = event.content;
      }

      // Use content.role instead of author for reliable message type detection
      if (!parsedContent?.role) {
        console.warn(
          `⚠️ [CONVERTER] Event ${event.id} missing content.role, skipping`
        );
        return null;
      }

      // Map ADK roles to frontend message types
      const messageType = parsedContent.role === "user" ? "human" : "ai";

      // Extract agent from author field
      const agent =
        event.author && typeof event.author === "string"
          ? event.author
          : undefined;

      const message: BaseMessage & {
        agent?: string;
        timelineActivities?: TimelineActivity[];
      } = {
        id: event.id,
        type: messageType,
        content: content.trim(),
        timestamp: new Date(event.timestamp),
        ...(agent && { agent }), // Only add agent field if it exists
      };

      console.log(`✅ [CONVERTER] Created message for event ${event.id}:`, {
        id: message.id,
        type: message.type,
        agent: message.agent,
        contentLength: message.content.length,
        timestamp: message.timestamp.toISOString(),
      });

      return message;
    })
    .filter(
      (
        message
      ): message is BaseMessage & {
        agent?: string;
        timelineActivities?: TimelineActivity[];
      } => message !== null
    ) // Remove null entries
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()); // Sort chronologically

  console.log("✅ [CONVERTER] Final converted messages:", {
    totalMessages: messages.length,
    messages: messages.map((m) => ({
      id: m.id,
      type: m.type,
      contentLength: m.content.length,
    })),
  });

  // Reconstruct timeline activities from events
  const timelineResult = reconstructTimelineFromEvents(events);
  console.log("✅ [CONVERTER] Final reconstructed timeline:", {
    totalActivities: timelineResult.activities.length,
    messageDistribution: Object.entries(timelineResult.messageCorrelation).map(
      ([msgIndex, activities]) => ({
        messageIndex: parseInt(msgIndex),
        activitiesCount: activities.length,
      })
    ),
  });

  // Distribute timeline activities across their originating messages
  const availableMessageIndices = Object.keys(timelineResult.messageCorrelation)
    .map((key) => parseInt(key))
    .sort((a, b) => a - b);

  console.log(
    "🔗 [CONVERTER] Available correlation message indices:",
    availableMessageIndices
  );

  let aiMessageIndex = 0; // Track AI message indices to match with correlation data
  let correlationIndex = 0; // Track position in available correlation indices

  for (let i = 0; i < messages.length; i++) {
    if (messages[i].type === "ai") {
      // Map AI message index to correlation message index
      const correlationMessageIndex = availableMessageIndices[correlationIndex];
      const activitiesForThisMessage =
        correlationMessageIndex !== undefined
          ? timelineResult.messageCorrelation[correlationMessageIndex]
          : undefined;

      if (activitiesForThisMessage && activitiesForThisMessage.length > 0) {
        messages[i] = {
          ...messages[i],
          timelineActivities: activitiesForThisMessage,
        };

        console.log(
          `✅ [CONVERTER] Distributed ${activitiesForThisMessage.length} timeline activities to AI message ${aiMessageIndex}:`,
          {
            messageId: messages[i].id,
            aiMessageIndex: aiMessageIndex,
            correlationMessageIndex: correlationMessageIndex,
            activities: activitiesForThisMessage.map((a) => ({
              type: a.type,
              agent: a.agent,
              title: a.title,
            })),
          }
        );

        correlationIndex++; // Move to next available correlation index
      }

      aiMessageIndex++;
    }
  }

  // Graceful fallback - if no activities were distributed, attach to last AI message
  const totalDistributedActivities = messages
    .filter((m) => m.timelineActivities)
    .reduce((sum, m) => sum + (m.timelineActivities?.length || 0), 0);

  if (
    timelineResult.activities.length > 0 &&
    totalDistributedActivities === 0
  ) {
    console.warn(
      "⚠️ [CONVERTER] Fallback: No activities were distributed to messages, attaching to last AI message"
    );
    const lastAiMessageIndex = messages.map((m) => m.type).lastIndexOf("ai");
    if (lastAiMessageIndex !== -1) {
      messages[lastAiMessageIndex] = {
        ...messages[lastAiMessageIndex],
        timelineActivities: timelineResult.activities,
      };
    }
  }

  console.log("✅ [CONVERTER] Timeline distribution complete:", {
    totalActivitiesGenerated: timelineResult.activities.length,
    totalActivitiesDistributed: totalDistributedActivities,
    messagesWithTimeline: messages.filter((m) => m.timelineActivities?.length)
      .length,
  });

  return {
    messages: messages as AdkMessage[],
    timelineActivities: timelineResult.activities,
  };
}

/**
 * Convenience function to convert a single ADK event to a message
 * Useful for real-time message processing
 */
export function convertSingleAdkEventToMessage(
  event: AdkEvent
): AdkMessage | null {
  const result = convertAdkEventsToMessages([event]);
  return result.messages.length > 0 ? result.messages[0] : null;
}
