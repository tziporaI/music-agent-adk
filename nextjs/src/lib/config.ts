/**
 * Environment-based configuration for Next.js API endpoints
 * Handles both local development and cloud deployment contexts
 */

export interface EndpointConfig {
  backendUrl: string;
  agentEngineUrl?: string;
  environment: "local" | "cloud";
  deploymentType: "local" | "agent_engine" | "cloud_run";
}

/**
 * Detects the current deployment environment based on available environment variables
 */
function detectEnvironment(): EndpointConfig["environment"] {
  // Check for Google Cloud deployment indicators
  if (
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.K_SERVICE ||
    process.env.FUNCTION_NAME
  ) {
    return "cloud";
  }

  // Default to local development
  return "local";
}

/**
 * Detects the deployment type based on environment variables
 */
function detectDeploymentType(): EndpointConfig["deploymentType"] {
  // Check for Agent Engine deployment (only use endpoint)
  if (process.env.AGENT_ENGINE_ENDPOINT) {
    return "agent_engine";
  }

  // Check for Cloud Run deployment
  if (process.env.K_SERVICE || process.env.CLOUD_RUN_SERVICE) {
    return "cloud_run";
  }

  // Default to local development
  return "local";
}

/**
 * Gets the backend URL based on deployment context
 */
function getBackendUrl(): string {
  const deploymentType = detectDeploymentType();

  switch (deploymentType) {
    case "agent_engine":
      // Agent Engine endpoint - only use the specific endpoint
      if (process.env.AGENT_ENGINE_ENDPOINT) {
        return process.env.AGENT_ENGINE_ENDPOINT;
      }
      throw new Error(
        "AGENT_ENGINE_ENDPOINT environment variable is required for Agent Engine deployment"
      );

    case "cloud_run":
      // Cloud Run deployment - use the service URL
      if (process.env.CLOUD_RUN_SERVICE_URL) {
        return process.env.CLOUD_RUN_SERVICE_URL;
      }
      break;

    case "local":
    default:
      // Local development - use configured backend URL or default
      return process.env.BACKEND_URL || "http://127.0.0.1:8001";
  }

  // Fallback to default local development URL
  return process.env.BACKEND_URL || "http://127.0.0.1:8001";
}

/**
 * Gets the Agent Engine URL for direct Agent Engine API calls
 */
function getAgentEngineUrl(): string | undefined {
  // Only use the direct endpoint, no more individual env var construction
  return process.env.AGENT_ENGINE_ENDPOINT || undefined;
}

/**
 * Creates the endpoint configuration based on current environment
 */
export function createEndpointConfig(): EndpointConfig {
  const environment = detectEnvironment();
  const deploymentType = detectDeploymentType();

  const config: EndpointConfig = {
    backendUrl: getBackendUrl(),
    agentEngineUrl: getAgentEngineUrl(),
    environment,
    deploymentType,
  };

  // Log configuration in development
  if (process.env.NODE_ENV === "development") {
    console.log("🔧 Endpoint Configuration:", {
      environment: config.environment,
      deploymentType: config.deploymentType,
      backendUrl: config.backendUrl,
      agentEngineUrl: config.agentEngineUrl,
    });
  }

  return config;
}

/**
 * Get the current endpoint configuration
 */
export const endpointConfig = createEndpointConfig();

/**
 * Utility function to get authentication headers for Google Cloud API calls
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // For Agent Engine deployment, we need proper Google Cloud authentication
  if (endpointConfig.deploymentType === "agent_engine") {
    try {
      // Use base64-encoded service account key from environment variables (for Vercel deployment)
      const serviceAccountKeyBase64 =
        process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64;

      if (!serviceAccountKeyBase64) {
        throw new Error(
          "GOOGLE_SERVICE_ACCOUNT_KEY_BASE64 environment variable is required for Agent Engine deployment"
        );
      }

      // Decode the base64-encoded service account key
      const serviceAccountKeyJson = Buffer.from(
        serviceAccountKeyBase64,
        "base64"
      ).toString("utf-8");
      const credentials = JSON.parse(serviceAccountKeyJson);

      // Use the service account to get an access token
      const { GoogleAuth } = await import("google-auth-library");
      const auth = new GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/cloud-platform"],
      });

      const authClient = await auth.getClient();
      const accessToken = await authClient.getAccessToken();

      if (accessToken.token) {
        headers["Authorization"] = `Bearer ${accessToken.token}`;
      }
    } catch (error) {
      console.error("Failed to get Google Cloud access token:", error);
      throw new Error("Authentication failed");
    }
  }

  return headers;
}

/**
 * Determines if we should use Agent Engine API directly
 */
export function shouldUseAgentEngine(): boolean {
  return (
    endpointConfig.deploymentType === "agent_engine" &&
    Boolean(endpointConfig.agentEngineUrl)
  );
}

/**
 * Agent Engine endpoint types
 */
export type AgentEngineEndpointType = "query" | "streamQuery" | "sessions";

/**
 * Gets the Agent Engine sessions API base URL (v1beta1)
 */
function getAgentEngineSessionsUrl(): string | undefined {
  if (!endpointConfig.agentEngineUrl) return undefined;

  // Sessions API uses v1beta1, construct from the base URL parts
  const urlParts = endpointConfig.agentEngineUrl.match(
    /^(https:\/\/[^\/]+)\/v1\/(projects\/[^\/]+\/locations\/[^\/]+\/reasoningEngines\/[^\/]+)/
  );

  if (urlParts) {
    const [, baseUrl, projectPath] = urlParts;
    return `${baseUrl}/v1beta1/${projectPath}`;
  }

  return undefined;
}

/**
 * Gets the appropriate endpoint for a given API path and operation type
 */
export function getEndpointForPath(
  path: string,
  endpointType: AgentEngineEndpointType = "streamQuery"
): string {
  if (shouldUseAgentEngine()) {
    // For Agent Engine, return the appropriate endpoint based on operation type
    if (endpointType === "streamQuery") {
      return `${endpointConfig.agentEngineUrl}:streamQuery`;
    } else if (endpointType === "query") {
      return `${endpointConfig.agentEngineUrl}:query`;
    } else if (endpointType === "sessions") {
      const sessionsUrl = getAgentEngineSessionsUrl();
      if (!sessionsUrl) {
        throw new Error(
          "Could not construct sessions API URL from AGENT_ENGINE_ENDPOINT"
        );
      }
      return `${sessionsUrl}/sessions${path}`;
    }
  }

  // For other deployments, append the path to the backend URL
  return `${endpointConfig.backendUrl}${path}`;
}

/**
 * Gets the Agent Engine streaming endpoint for chat responses
 */
export function getAgentEngineStreamEndpoint(): string {
  return getEndpointForPath("", "streamQuery");
}
