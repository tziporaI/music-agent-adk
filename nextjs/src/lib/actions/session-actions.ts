"use server";

import {
  createSessionWithService,
  SessionCreationResult,
} from "@/lib/services/session-service";

/**
 * Server Action to create a new session
 * Backend will generate and return the session ID
 */
export async function createSessionAction(
  userId: string
): Promise<SessionCreationResult> {
  try {
    console.log(`📡 Server Action - Creating session for userId: ${userId}`);

    const result = await createSessionWithService(userId);

    console.log(`✅ Server Action - Session creation result:`, result);

    return result;
  } catch (error) {
    console.error("Server Action - Session creation error:", error);

    return {
      success: false,
      sessionId: "",
      created: false,
      error: `Server Action error: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}
