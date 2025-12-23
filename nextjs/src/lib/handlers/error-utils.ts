import { NextResponse } from "next/server";
import { ApiResponse } from "@/types";

/**
 * Standard error response structure for consistent error handling
 */
export interface StandardErrorResponse {
  success: false;
  error: string;
  details?: string;
  statusCode?: number;
}

/**
 * Error types for better error categorization
 */
export enum GoalPlanningErrorType {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR",
  BACKEND_CONNECTION_ERROR = "BACKEND_CONNECTION_ERROR",
  STREAMING_ERROR = "STREAMING_ERROR",
  SESSION_CREATION_ERROR = "SESSION_CREATION_ERROR",
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
}

/**
 * Create a consistent error response with proper status codes
 */
export function createErrorResponse(
  error: string,
  statusCode: number = 500,
  details?: string
): NextResponse<ApiResponse<never>> {
  const errorResponse: StandardErrorResponse = {
    success: false,
    error,
    details,
    statusCode,
  };

  return NextResponse.json(errorResponse as ApiResponse<never>, {
    status: statusCode,
  });
}

/**
 * Create validation error response (400)
 */
export function createValidationError(
  message: string,
  details?: string
): NextResponse<ApiResponse<never>> {
  return createErrorResponse(message, 400, details);
}

/**
 * Create authentication error response (401)
 */
export function createAuthenticationError(
  message: string = "Authentication failed",
  details?: string
): NextResponse<ApiResponse<never>> {
  return createErrorResponse(message, 401, details);
}

/**
 * Create backend connection error response (502)
 */
export function createBackendConnectionError(
  deploymentType: "agent_engine" | "local_backend",
  statusCode: number,
  statusText: string,
  details?: string
): NextResponse<ApiResponse<never>> {
  const message = `${
    deploymentType === "agent_engine" ? "Agent Engine" : "Local backend"
  } connection error: ${statusCode} ${statusText}`;

  // Map backend error codes to appropriate client error codes
  let clientStatusCode: number;
  if (statusCode >= 500) {
    clientStatusCode = 502; // Bad Gateway
  } else if (statusCode === 401 || statusCode === 403) {
    clientStatusCode = statusCode; // Pass through auth errors
  } else if (statusCode >= 400) {
    clientStatusCode = 400; // Bad Request for client errors
  } else {
    clientStatusCode = 502; // Default to Bad Gateway
  }

  return createErrorResponse(message, clientStatusCode, details);
}

/**
 * Create streaming error response (500)
 */
export function createStreamingError(
  deploymentType: "agent_engine" | "local_backend",
  error: Error | unknown,
  details?: string
): NextResponse<ApiResponse<never>> {
  const message = `${
    deploymentType === "agent_engine" ? "Agent Engine" : "Local backend"
  } streaming error`;
  const errorDetails =
    details ||
    (error instanceof Error ? error.message : "Unknown streaming error");

  console.error(`❌ ${message}:`, error);

  return createErrorResponse(message, 500, errorDetails);
}

/**
 * Create session creation error response (500)
 */
export function createSessionCreationError(
  deploymentType: "agent_engine" | "local_backend",
  details?: string
): NextResponse<ApiResponse<never>> {
  const message = `Failed to create session for ${
    deploymentType === "agent_engine" ? "Agent Engine" : "local backend"
  }`;

  return createErrorResponse(message, 500, details);
}

/**
 * Create generic internal server error response (500)
 */
export function createInternalServerError(
  message: string = "Failed to process goal planning request",
  error?: Error | unknown,
  details?: string
): NextResponse<ApiResponse<never>> {
  console.error("❌ Goal planning endpoint error:", error);

  const errorDetails =
    details || (error instanceof Error ? error.message : undefined);

  return createErrorResponse(message, 500, errorDetails);
}

/**
 * Log error details for debugging
 */
export function logError(
  errorType: GoalPlanningErrorType,
  deploymentType: "agent_engine" | "local_backend" | "general",
  error: Error | unknown,
  context?: Record<string, unknown>
): void {
  const timestamp = new Date().toISOString();
  const prefix = `❌ [${timestamp}] ${errorType} [${deploymentType}]`;

  console.error(prefix, error);

  if (context) {
    console.error(`${prefix} Context:`, context);
  }
}

/**
 * Extract error message from fetch response
 */
export async function extractErrorFromResponse(
  response: Response
): Promise<string> {
  try {
    const errorText = await response.text();
    return errorText || `HTTP ${response.status} ${response.statusText}`;
  } catch (error) {
    console.warn("Could not extract error text from response:", error);
    return `HTTP ${response.status} ${response.statusText}`;
  }
}

/**
 * Handle fetch errors with proper error categorization
 */
export async function handleFetchError(
  error: unknown,
  deploymentType: "agent_engine" | "local_backend",
  operation: string
): Promise<NextResponse<ApiResponse<never>>> {
  if (error instanceof TypeError && error.message.includes("fetch")) {
    // Network/connection error
    logError(
      GoalPlanningErrorType.BACKEND_CONNECTION_ERROR,
      deploymentType,
      error,
      { operation }
    );

    return createBackendConnectionError(
      deploymentType,
      503, // Service Unavailable
      "Connection failed",
      `Failed to connect to ${deploymentType} for ${operation}`
    );
  }

  // Generic error
  logError(GoalPlanningErrorType.INTERNAL_SERVER_ERROR, deploymentType, error, {
    operation,
  });

  return createInternalServerError(`Failed to ${operation}`, error);
}

/**
 * Validate that response is suitable for streaming and create appropriate error if not
 */
export async function validateStreamingResponseOrCreateError(
  response: Response,
  deploymentType: "agent_engine" | "local_backend"
): Promise<NextResponse<ApiResponse<never>> | null> {
  if (!response.ok) {
    const errorDetails = await extractErrorFromResponse(response);

    logError(
      GoalPlanningErrorType.BACKEND_CONNECTION_ERROR,
      deploymentType,
      new Error(
        `Stream response error: ${response.status} ${response.statusText}`
      ),
      { errorDetails }
    );

    return createBackendConnectionError(
      deploymentType,
      response.status,
      response.statusText,
      errorDetails
    );
  }

  if (!response.body) {
    logError(
      GoalPlanningErrorType.STREAMING_ERROR,
      deploymentType,
      new Error("No response body for streaming")
    );

    return createStreamingError(
      deploymentType,
      new Error("No response body available for streaming")
    );
  }

  return null; // No error, response is valid for streaming
}
