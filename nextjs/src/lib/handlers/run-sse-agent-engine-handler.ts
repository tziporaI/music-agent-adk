/**
 * Agent Engine Handler for Run SSE API Route
 *
 * Handles requests for Agent Engine deployment configuration.
 * This handler processes streaming JSON fragments from Agent Engine and converts them to SSE format.
 *
 * IMPORTANT:
 * Agent Engine often returns NDJSON-like stream (multiple JSON objects separated by newlines),
 * NOT one single JSON object. לכן אנחנו מפרקים לפי שורות ומריצים JSON.parse לכל שורה שלמה.
 */

import { getEndpointForPath, getAuthHeaders } from "@/lib/config";
import {
  ProcessedStreamRequest,
  formatAgentEnginePayload,
  logStreamStart,
  logStreamResponse,
  SSE_HEADERS,
} from "./run-sse-common";
import {
  createInternalServerError,
  createBackendConnectionError,
} from "./error-utils";

/**
 * Agent Engine JSON Fragment Types
 * Based on the actual format Agent Engine returns
 */
interface AgentEngineContentPart {
  text?: string;
  thought?: boolean;
  function_call?: {
    name: string;
    args: Record<string, unknown>;
    id: string;
  };
  function_response?: {
    name: string;
    response: Record<string, unknown>;
    id: string;
  };
}

interface AgentEngineFragment {
  content?: {
    parts?: AgentEngineContentPart[];
  };
  role?: string;
  author?: string;
  usage_metadata?: {
    candidates_token_count?: number;
    prompt_token_count?: number;
    total_token_count?: number;
    thoughts_token_count?: number;
  };
  invocation_id?: string;
  actions?: {
    state_delta?: Record<string, unknown>;
    artifact_delta?: Record<string, unknown>;
    requested_auth_configs?: Record<string, unknown>;
  };
  isFinal?: boolean;
}

/**
 * Processes streaming JSON fragments from Agent Engine and converts them to SSE.
 *
 * FIX:
 * Agent Engine returns multiple JSON objects in the stream (often separated by '\n').
 * So we parse line-by-line (NDJSON style) and keep the remainder in buffer.
 */
class JSONFragmentProcessor {
  private buffer: string = "";
  private currentAgent: string = "";
  private sentParts: Set<string> = new Set();

  constructor(
    private controller: ReadableStreamDefaultController<Uint8Array>
  ) {}

  /**
   * Process incoming chunk of data from Agent Engine.
   * NDJSON parsing: parse complete lines, keep leftover in buffer.
   */
  processChunk(chunk: string): void {
    this.buffer += chunk;

    // Parse complete lines
    while (true) {
      const newlineIdx = this.buffer.indexOf("\n");
      if (newlineIdx === -1) break;

      const rawLine = this.buffer.slice(0, newlineIdx);
      this.buffer = this.buffer.slice(newlineIdx + 1);

      const line = rawLine.trim();
      if (!line) continue;

      // Support optional "data: ..." prefix (in case upstream sends SSE-like)
      const payload = line.startsWith("data:") ? line.slice(5).trim() : line;

      try {
        const fragment: AgentEngineFragment = JSON.parse(payload);
        this.processCompleteFragment(fragment);
      } catch (error) {
        console.error("❌ [JSON PROCESSOR] Failed to parse line:", payload, error);
      }
    }
  }

  /**
   * Stable dedupe key for parts
   */
  private partKey(part: AgentEngineContentPart): string {
    // JSON stringify is fine here; avoids buggy short-hash collisions
    return JSON.stringify(part);
  }

  /**
   * Emit a single part as SSE to the frontend
   */
  private emitPartAsSSE(part: AgentEngineContentPart): void {
    const sseData = {
      content: { parts: [part] },
      author: this.currentAgent || "goal_planning_agent",
    };

    const sseEvent = `data: ${JSON.stringify(sseData)}\n\n`;
    this.controller.enqueue(Buffer.from(sseEvent));
  }

  /**
   * Process a full fragment (one JSON object from the upstream stream)
   */
  processCompleteFragment(fragment: AgentEngineFragment): void {
    this.currentAgent = fragment.author || "goal_planning_agent";

    // Emit all parts (text/thought/function_call/function_response)
    if (fragment.content?.parts && Array.isArray(fragment.content.parts)) {
      for (const part of fragment.content.parts) {
        const key = this.partKey(part);
        if (this.sentParts.has(key)) continue;

        this.emitPartAsSSE(part);
        this.sentParts.add(key);
      }
    }

    // Emit metadata/actions if present
    if (
      fragment.actions ||
      fragment.usage_metadata ||
      fragment.invocation_id ||
      fragment.isFinal
    ) {
      const additionalData: Record<string, unknown> = {
        author: fragment.author || "goal_planning_agent",
      };

      if (fragment.actions) additionalData.actions = fragment.actions;
      if (fragment.usage_metadata) additionalData.usage_metadata = fragment.usage_metadata;
      if (fragment.invocation_id) additionalData.invocation_id = fragment.invocation_id;
      if (fragment.isFinal) additionalData.isFinal = fragment.isFinal;

      const sseEvent = `data: ${JSON.stringify(additionalData)}\n\n`;
      this.controller.enqueue(Buffer.from(sseEvent));
    }
  }

  /**
   * Finalize: parse any remaining buffer lines (and optionally the last partial line if it's complete JSON)
   */
  finalize(): void {
    const remaining = this.buffer.trim();
    if (!remaining) return;

    const lines = remaining
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    for (const line of lines) {
      const payload = line.startsWith("data:") ? line.slice(5).trim() : line;

      try {
        const fragment: AgentEngineFragment = JSON.parse(payload);
        this.processCompleteFragment(fragment);
      } catch (error) {
        // If the last line is partial JSON, this can fail — that's OK.
        console.error(
          "❌ [JSON PROCESSOR] Failed to parse remaining line on finalize:",
          payload,
          error
        );
      }
    }

    this.buffer = "";
  }
}

/**
 * Handle Agent Engine streaming request with JSON fragment processing
 */
export async function handleAgentEngineStreamRequest(
  requestData: ProcessedStreamRequest
): Promise<Response> {
  console.log("🚀 [AGENT ENGINE] JSON FRAGMENT HANDLER STARTING");
  console.log("📊 [AGENT ENGINE] Request data:", JSON.stringify(requestData, null, 2));

  try {
    const agentEnginePayload = formatAgentEnginePayload(requestData);
    const agentEngineUrl = getEndpointForPath("", "streamQuery");

    logStreamStart(agentEngineUrl, agentEnginePayload, "agent_engine");

    const authHeaders = await getAuthHeaders();

    const response = await fetch(agentEngineUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify(agentEnginePayload),
    });

    logStreamResponse(
      response.status,
      response.statusText,
      response.headers,
      "agent_engine"
    );

    if (!response.ok) {
      let errorDetails = `Agent Engine returned an error: ${response.status} ${response.statusText}`;
      try {
        const errorText = await response.text();
        console.error("❌ Agent Engine error details:", errorText);
        if (errorText) errorDetails += `. ${errorText}`;
      } catch (error) {
        console.error(
          "❌ Failed reading error response body from Agent Engine:",
          error
        );
      }

      return createBackendConnectionError(
        "agent_engine",
        response.status,
        response.statusText,
        errorDetails
      );
    }

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          controller.error(new Error("No readable stream from Agent Engine"));
          return;
        }

        const processor = new JSONFragmentProcessor(controller);

        const timeoutMs = 5 * 60 * 1000;
        const startTime = Date.now();
        let isStreamActive = true;

        try {
          const pump = async (): Promise<void> => {
            if (Date.now() - startTime > timeoutMs) {
              console.error("❌ [AGENT ENGINE] Stream timeout after 5 minutes");
              processor.finalize();
              controller.close();
              return;
            }

            if (!isStreamActive) return;

            const { done, value } = await reader.read();

            if (value) {
              const chunk = decoder.decode(value, { stream: true });
              processor.processChunk(chunk);
            }

            if (done) {
              processor.finalize();
              controller.close();
              isStreamActive = false;
              return;
            }

            return pump();
          };

          await pump();
        } catch (error) {
          console.error("❌ [AGENT ENGINE] JSON fragment processing error:", error);

          try {
            processor.finalize();
          } catch (finalizeError) {
            console.error("❌ [AGENT ENGINE] Error during finalization:", finalizeError);
          }

          controller.error(error);
        } finally {
          isStreamActive = false;
          reader.releaseLock();
        }
      },
    });

    return new Response(stream, {
      status: 200,
      headers: SSE_HEADERS,
    });
  } catch (error) {
    console.error("❌ Agent Engine handler error:", error);

    if (error instanceof TypeError && error.message.includes("fetch")) {
      return createBackendConnectionError(
        "agent_engine",
        500,
        "Connection failed",
        "Failed to connect to Agent Engine"
      );
    }

    return createInternalServerError(
      "agent_engine",
      error,
      "Failed to process Agent Engine streaming request"
    );
  }
}
