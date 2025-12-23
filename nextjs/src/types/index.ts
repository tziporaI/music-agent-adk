export type DisplayData = string | null;

// Core message types for single-agent chat
export interface Message {
  type: "human" | "ai";
  content: string;
  id: string;
  timestamp: Date;
}

// Goal planning types
export interface Goal {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  goalId: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  priority: "low" | "medium" | "high";
  dependencies: string[]; // Task IDs that must be completed first
  createdAt: Date;
  updatedAt: Date;
}

export interface SubTask {
  id: string;
  taskId: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}

// Single agent response types
export interface AgentMessage {
  parts: { text: string }[];
  role: string;
}

export interface AgentResponse {
  content: AgentMessage;
  usageMetadata: {
    candidatesTokenCount: number;
    promptTokenCount: number;
    totalTokenCount: number;
  };
  planningData?: {
    goal?: Goal;
    tasks?: Task[];
    subTasks?: SubTask[];
    currentPhase?:
      | "analysis"
      | "planning"
      | "breakdown"
      | "execution"
      | "review";
  };
}

// Timeline event types for goal planning
export interface TimelineEvent {
  id: string;
  type:
    | "goal_created"
    | "task_created"
    | "task_completed"
    | "goal_completed"
    | "planning_started"
    | "planning_completed";
  title: string;
  description: string;
  timestamp: Date;
  relatedId?: string; // ID of related goal, task, or subtask
  metadata?: Record<string, unknown>;
}

// SSE event types for streaming
export interface SSEEvent {
  event: string;
  data: string;
}

export interface ProcessedEvent {
  type: "text" | "planning" | "goal" | "task" | "status" | "error";
  content: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

// Chat session types
export interface ChatSession {
  id: string;
  userId: string;
  goal?: Goal;
  tasks: Task[];
  subTasks: SubTask[];
  messages: Message[];
  timeline: TimelineEvent[];
  createdAt: Date;
  updatedAt: Date;
}

// API response types
export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// Form types
export interface GoalInput {
  title: string;
  description: string;
}

export interface TaskInput {
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
}
