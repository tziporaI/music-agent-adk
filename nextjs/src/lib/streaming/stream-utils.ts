/**
 * Stream Utilities
 *
 * Shared utility functions for streaming operations, including agent
 * identification, event title generation, and common streaming helpers.
 */

/**
 * Generates user-friendly event titles based on agent names
 *
 * This function maps technical agent names to user-friendly activity descriptions
 * for display in the activity timeline.
 *
 * @param agentName - The technical name of the agent
 * @returns User-friendly title for the activity
 */
export function getEventTitle(agentName: string): string {
  // For single agent, focus on activity type rather than agent name
  if (agentName === "goal_planning_agent") {
    return "🎯 Planning Strategy";
  }
  if (agentName.includes("plan") || agentName.includes("planning")) {
    return "🎯 Planning Strategy";
  }
  if (agentName.includes("research") || agentName.includes("search")) {
    return "🔍 Researching Information";
  }
  if (agentName.includes("analysis") || agentName.includes("evaluating")) {
    return "📊 Analyzing Content";
  }
  if (agentName.includes("writing") || agentName.includes("report")) {
    return "✍️ Writing Response";
  }
  return `Processing (${agentName || "AI Agent"})`;
}

/**
 * Safely truncates data for logging purposes
 *
 * @param data - Data to truncate
 * @param maxLength - Maximum length before truncation (default: 200)
 * @returns Truncated data string
 */
export function truncateForLogging(
  data: string,
  maxLength: number = 200
): string {
  return data.length > maxLength ? data.substring(0, maxLength) + "..." : data;
}

/**
 * Checks if a string represents valid JSON
 *
 * @param str - String to validate
 * @returns True if the string is valid JSON
 */
export function isValidJSON(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Formats function call information for display
 *
 * @param name - Function name
 * @param args - Function arguments
 * @returns Formatted display string
 */
export function formatFunctionCall(
  name: string,
  args: Record<string, unknown>
): string {
  const argCount = Object.keys(args).length;
  return `${name}(${argCount} argument${argCount !== 1 ? "s" : ""})`;
}

/**
 * Formats function response information for display
 *
 * @param name - Function name
 * @param response - Function response data
 * @returns Formatted display string
 */
export function formatFunctionResponse(
  name: string,
  response: Record<string, unknown>
): string {
  const hasResponse = Object.keys(response).length > 0;
  return `${name} → ${hasResponse ? "Response received" : "No response"}`;
}
