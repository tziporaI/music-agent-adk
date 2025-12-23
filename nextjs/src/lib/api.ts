// API utility functions for backend communication
export interface SessionData {
  userId: string;
  sessionId: string;
  appName: string;
}

export interface ChatMessage {
  parts: Array<{ text: string }>;
  role: "user" | "assistant";
}

export interface ChatRequest {
  appName: string;
  userId: string;
  sessionId: string;
  newMessage: ChatMessage;
  streaming: boolean;
}

// Retry utility with exponential backoff
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 10,
  maxDuration: number = 120000 // 2 minutes
): Promise<T> {
  const startTime = Date.now();
  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (Date.now() - startTime > maxDuration) {
      throw new Error(`Retry timeout after ${maxDuration}ms`);
    }

    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      const delay = Math.min(1000 * Math.pow(2, attempt), 5000); // Exponential backoff, max 5s
      console.log(
        `Attempt ${attempt + 1} failed, retrying in ${delay}ms...`,
        error
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

// Create a new session
export async function createSession(sessionId: string): Promise<SessionData> {
  const response = await fetch(
    `/api/apps/app/users/u_999/sessions/${sessionId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to create session: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  return {
    userId: data.userId,
    sessionId: data.id,
    appName: data.appName,
  };
}

// Check backend health
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch("/api/health", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.ok;
  } catch (error) {
    console.log("Backend not ready yet:", error);
    return false;
  }
}

// Send chat message with SSE streaming
export async function sendChatMessage(request: ChatRequest): Promise<Response> {
  const response = await fetch("/api/run_sse", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to send message: ${response.status} ${response.statusText}`
    );
  }

  return response;
}

// Wait for backend to be ready with retry logic
export async function waitForBackend(
  maxAttempts: number = 60
): Promise<boolean> {
  let attempts = 0;

  while (attempts < maxAttempts) {
    const isReady = await checkBackendHealth();
    if (isReady) {
      return true;
    }

    attempts++;
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds between checks
  }

  // If we get here, backend didn't come up in time
  console.error("Backend failed to start within the specified time");
  return false;
}
