/**
 * Streaming utilities for SSE (Server-Sent Events) handling
 * Provides reusable streaming logic for both Agent Engine and local backend deployments
 */

import { SSE_HEADERS } from "./run-sse-common";

/**
 * Create a streaming response with proper SSE headers
 */
export function createStreamingResponse(stream: ReadableStream): Response {
  return new Response(stream, {
    headers: SSE_HEADERS,
  });
}

/**
 * Create a simple pass-through stream (for Agent Engine)
 * This forwards SSE chunks directly from the source without processing
 */
export function createPassThroughStream(
  sourceResponse: Response,
  deploymentType: "agent_engine" | "local_backend"
): ReadableStream {
  return new ReadableStream({
    start(controller) {
      if (!sourceResponse.body) {
        console.log(
          `❌ No response body from ${deploymentType} for goal planning`
        );
        controller.close();
        return;
      }

      console.log(
        `✅ ${deploymentType} goal planning response body exists, starting stream reader...`
      );

      const reader = sourceResponse.body.getReader();
      const decoder = new TextDecoder();
      let chunkCount = 0;

      async function pump(): Promise<void> {
        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              console.log(
                `🏁 Goal planning stream complete after ${chunkCount} chunks`
              );
              break;
            }

            chunkCount++;
            const chunk = decoder.decode(value, { stream: true });
            console.log(
              `📦 Goal planning chunk ${chunkCount} received (${chunk.length} bytes):`,
              chunk.substring(0, 200) + (chunk.length > 200 ? "..." : "")
            );

            // Forward the SSE chunk as-is
            controller.enqueue(new TextEncoder().encode(chunk));
            console.log(
              `✅ Goal planning chunk ${chunkCount} forwarded to client`
            );
          }
        } catch (error) {
          console.error(
            `❌ Error reading ${deploymentType} goal planning stream:`,
            error
          );
        } finally {
          console.log(
            `🔚 Closing goal planning stream controller after ${chunkCount} chunks`
          );
          controller.close();
        }
      }

      pump();
    },
  });
}

/**
 * Utility to check if a fetch response is suitable for streaming
 */
export function validateStreamingResponse(
  response: Response,
  deploymentType: "agent_engine" | "local_backend"
): boolean {
  if (!response.ok) {
    console.error(
      `❌ ${deploymentType} goal planning stream error:`,
      response.status,
      response.statusText
    );
    return false;
  }

  if (!response.body) {
    console.error(`❌ ${deploymentType} response has no body for streaming`);
    return false;
  }

  return true;
}
