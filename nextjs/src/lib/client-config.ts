/**
 * Client-safe configuration utilities
 *
 * This module provides configuration functions that can be safely used
 * in both client and server environments without importing server dependencies.
 */

/**
 * Determines if we should use Agent Engine based on environment variables
 * This is safe to use in client-side code (SSE parser, hooks, etc.)
 */
export function shouldUseAgentEngine(): boolean {
  // Check for Agent Engine endpoint - this env var should be available on both client and server
  return Boolean(process.env.AGENT_ENGINE_ENDPOINT|| process.env.NEXT_PUBLIC_AGENT_ENGINE_ENDPOINT);
}
