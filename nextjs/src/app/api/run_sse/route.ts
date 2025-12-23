import { NextRequest } from "next/server";
import { shouldUseAgentEngine } from "@/lib/config";
import {
  parseStreamRequest,
  logStreamRequest,
  CORS_HEADERS,
} from "@/lib/handlers/run-sse-common";
import {
  createValidationError,
  createInternalServerError,
} from "@/lib/handlers/error-utils";
import { handleAgentEngineStreamRequest } from "@/lib/handlers/run-sse-agent-engine-handler";
import { handleLocalBackendStreamRequest } from "@/lib/handlers/run-sse-local-backend-handler";

// Configure maximum execution duration (5 minutes = 300 seconds)
export const maxDuration = 300;

/**
 * Run SSE API Route - Main Orchestrator
 * Uses strategy pattern to delegate to appropriate deployment handler
 *
 * @param request - The incoming HTTP request
 * @returns Streaming SSE response with real-time data
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    // Parse and validate the incoming request
    const { data: requestData, validation } = await parseStreamRequest(request);

    if (!validation.isValid || !requestData) {
      return createValidationError(
        validation.error || "Invalid request format"
      );
    }

    // Determine deployment strategy based on configuration
    const deploymentType = shouldUseAgentEngine()
      ? "agent_engine"
      : "local_backend";

    // Log the incoming request with deployment strategy
    logStreamRequest(
      requestData.sessionId,
      requestData.userId,
      requestData.message,
      deploymentType
    );

    // Delegate to appropriate deployment strategy handler
    if (deploymentType === "agent_engine") {
      return await handleAgentEngineStreamRequest(requestData);
    } else {
      return await handleLocalBackendStreamRequest(requestData);
    }
  } catch (error) {
    // Handle any unexpected errors at the top level
    return createInternalServerError(
      "Failed to process streaming request",
      error
    );
  }
}

/**
 * Handle preflight requests for CORS
 * @returns CORS headers for preflight requests
 */
export async function OPTIONS(): Promise<Response> {
  return new Response(null, {
    status: 200,
    headers: CORS_HEADERS,
  });
}
