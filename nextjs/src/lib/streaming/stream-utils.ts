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
/**
 * Generates user-friendly event titles based on agent/tool names (Music Agent)
 */
export function getEventTitle(agentName: string): string {
  const name = (agentName || "").toLowerCase();

  // Main agent (common names)
  if (name === "music_agent" || name.includes("music-agent") || name.includes("musicagent")) {
    return "Music Agent";
  }

  // Tools (based on your repo's tools)
  if (name.includes("search_by_artist") || name.includes("artist")) {
    return "Searching by artist";
  }

  if (name.includes("search_by_genre") || name.includes("genre")) {
    return "Searching by genre";
  }

  if (name.includes("search_by_mood") || name.includes("mood")) {
    return "Matching mood to music";
  }

  if (name.includes("search_music_api") || name.includes("search_music") || name.includes("deezer")) {
    return "Searching tracks (Deezer)";
  }

  // Common “steps” you may log in the UI
  if (name.includes("history") || name.includes("memory") || name.includes("session")) {
    return "Checking session history";
  }

  if (name.includes("format") || name.includes("table") || name.includes("html")) {
    return "Formatting recommendations";
  }

  // Fallback
  return `Processing (${agentName || "Music Agent"})`;
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
