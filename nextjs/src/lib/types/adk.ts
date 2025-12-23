/**
 * ADK Session API Types based on ADK documentation
 * These match the actual ADK Java API types converted to TypeScript
 * Ported from web project for session history functionality
 */

export interface AdkEvent {
  id: string;
  author: string;
  content?: AdkContent;
  actions?: AdkEventActions;
  invocationId: string;
  timestamp: number;
  partial?: boolean;
  turnComplete?: boolean;
  errorCode?: string;
  errorMessage?: string;
  interrupted?: boolean;
  branch?: string;
  groundingMetadata?: Record<string, unknown>;
}

export interface AdkContent {
  parts: AdkPart[];
  role: "user" | "model"; // ADK uses "user" for human messages, "model" for AI messages
}

export interface AdkPart {
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
  // Other ADK part types
  video_metadata?: unknown;
  inline_data?: unknown;
  file_data?: unknown;
  thought_signature?: unknown;
  code_execution_result?: unknown;
  executable_code?: unknown;
}

export interface AdkEventActions {
  stateDelta?: Record<string, unknown>;
}

export interface AdkSession {
  id: string;
  app_name: string;
  user_id: string;
  state: Record<string, unknown> | null;
  last_update_time: string | null; // ISO timestamp string from datetime
  events?: AdkEvent[]; // Optional events array (included in session detail endpoint)
}

export interface ListSessionsResponse {
  sessions: AdkSession[];
  sessionIds: string[];
}

export interface ListEventsResponse {
  events: AdkEvent[];
  nextPageToken?: string;
}

export interface CreateSessionRequest {
  state?: Record<string, unknown>;
}

/**
 * Combined session with events for historical loading
 */
export interface AdkSessionWithEvents extends AdkSession {
  events: AdkEvent[];
}

/**
 * Result interface for message conversion from ADK events
 */
export interface ConversionResult {
  messages: Message[];
  timelineActivities: TimelineActivity[];
}

/**
 * Timeline activity interface for ADK event activities
 */
export interface TimelineActivity {
  id: string;
  type: string;
  agent: string;
  title: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Extended Message interface with timeline activities
 * Extends the base Message type from types/index.ts
 */
import type { Message as BaseMessage } from "@/types";

export interface Message extends BaseMessage {
  agent?: string;
  timelineActivities?: TimelineActivity[];
}
