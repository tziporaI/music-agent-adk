import { NextRequest } from "next/server";
import { GoalInput } from "@/types";

/**
 * Common types shared by all deployment strategies
 */
export interface ProcessedRequest {
  goal: GoalInput;
  sessionId: string;
  userId: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// Legacy interface - use SessionCreationResult from session-service.ts instead
export interface LegacySessionCreationResult {
  sessionId: string;
  created: boolean;
}

/**
 * CORS headers for OPTIONS requests
 */
export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
} as const;

/**
 * Parse and validate the incoming request body
 */
export async function parseRequest(request: NextRequest): Promise<{
  data: ProcessedRequest | null;
  validation: ValidationResult;
}> {
  try {
    const requestBody = (await request.json()) as {
      goal: GoalInput;
      sessionId?: string;
      userId?: string;
    };

    // Validate required fields
    const validation = validateGoalRequest(requestBody);
    if (!validation.isValid) {
      return { data: null, validation };
    }

    // Validate required session and user IDs
    if (!requestBody.sessionId) {
      return {
        data: null,
        validation: {
          isValid: false,
          error: "Session ID is required",
        },
      };
    }

    if (!requestBody.userId) {
      return {
        data: null,
        validation: {
          isValid: false,
          error: "User ID is required",
        },
      };
    }

    const sessionId = requestBody.sessionId;
    const userId = requestBody.userId;

    return {
      data: {
        goal: requestBody.goal,
        sessionId,
        userId,
      },
      validation: { isValid: true },
    };
  } catch (error) {
    console.error("Request parsing error:", error);
    return {
      data: null,
      validation: {
        isValid: false,
        error: "Invalid request format",
      },
    };
  }
}

/**
 * Validate the goal request structure
 */
export function validateGoalRequest(requestBody: {
  goal: GoalInput;
  sessionId?: string;
  userId?: string;
}): ValidationResult {
  if (!requestBody.goal?.title || !requestBody.goal?.description) {
    return {
      isValid: false,
      error: "Goal title and description are required",
    };
  }

  if (
    typeof requestBody.goal.title !== "string" ||
    typeof requestBody.goal.description !== "string"
  ) {
    return {
      isValid: false,
      error: "Goal title and description must be strings",
    };
  }

  if (
    requestBody.goal.title.trim().length === 0 ||
    requestBody.goal.description.trim().length === 0
  ) {
    return {
      isValid: false,
      error: "Goal title and description cannot be empty",
    };
  }

  return { isValid: true };
}

/**
 * Format goal data into a message string
 */
export function formatGoalMessage(goal: GoalInput): string {
  return `Goal: ${goal.title}\n\nDescription: ${goal.description}`;
}

/**
 * Centralized logging for goal planning operations
 */
export function logGoalPlanningRequest(
  sessionId: string,
  userId: string,
  goal: GoalInput,
  deploymentType: "agent_engine" | "local_backend"
): void {
  console.log(
    `📡 Goal Planning API [${deploymentType}] - Session: ${sessionId}, User: ${userId}`
  );
  console.log(`📡 Goal:`, goal);
}
