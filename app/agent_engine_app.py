"""
Agent Engine App - Deploy your agent to Google Cloud

This file contains the logic to deploy your agent to Vertex AI Agent Engine.
"""
import copy
import datetime
import json
import os
from pathlib import Path
from typing import Any

import vertexai
from google.adk.artifacts import GcsArtifactService
from google.cloud import logging as google_cloud_logging
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider, export
from vertexai import agent_engines
from vertexai.preview.reasoning_engines import AdkApp

from .agent import root_agent
from .config import config, get_deployment_config
from .utils.gcs import create_bucket_if_not_exists
from .utils.tracing import CloudTraceLoggingSpanExporter
from .utils.typing import Feedback


class AgentEngineApp(AdkApp):
    """
    ADK Application wrapper for Agent Engine deployment.

    This class extends the base ADK app with logging, tracing, and feedback capabilities.
    """

    def set_up(self) -> None:
        """Set up logging and tracing for the agent engine app."""
        super().set_up()
        logging_client = google_cloud_logging.Client()
        self.logger = logging_client.logger(__name__)
        provider = TracerProvider()
        processor = export.BatchSpanProcessor(
            CloudTraceLoggingSpanExporter(
                project_id=os.environ.get("GOOGLE_CLOUD_PROJECT"),
                service_name=f"{config.deployment_name}-service",
            )
        )
        provider.add_span_processor(processor)
        trace.set_tracer_provider(provider)
        self.enable_tracing = True

    def register_feedback(self, feedback: dict[str, Any]) -> None:
        """Collect and log feedback from users."""
        feedback_obj = Feedback.model_validate(feedback)
        self.logger.log_struct(feedback_obj.model_dump(), severity="INFO")

    def register_operations(self) -> dict[str, list[str]]:
        """Register available operations for the agent."""
        operations = super().register_operations()
        operations[""] = operations[""] + ["register_feedback"]
        return operations

    def clone(self) -> "AgentEngineApp":
        """Create a copy of this application."""
        template_attributes = self._tmpl_attrs

        return self.__class__(
            agent=copy.deepcopy(template_attributes["agent"]),
            enable_tracing=bool(template_attributes.get("enable_tracing", False)),
            session_service_builder=template_attributes.get("session_service_builder"),
            artifact_service_builder=template_attributes.get(
                "artifact_service_builder"
            ),
            env_vars=template_attributes.get("env_vars"),
        )


def deploy_agent_engine_app() -> agent_engines.AgentEngine:
    """
    Deploy the agent to Vertex AI Agent Engine.

    This function:
    1. Gets deployment configuration from environment variables
    2. Creates required Google Cloud Storage buckets
    3. Deploys the agent to Agent Engine
    4. Saves deployment metadata to logs/deployment_metadata.json

    Returns:
        The deployed agent engine instance
    """
    print("🚀 Starting Agent Engine deployment...")

    # Step 1: Get deployment configuration
    deployment_config = get_deployment_config()
    print(f"📋 Deploying agent: {deployment_config.agent_name}")
    print(f"📋 Project: {deployment_config.project}")
    print(f"📋 Location: {deployment_config.location}")
    print(f"📋 Staging bucket: {deployment_config.staging_bucket}")

    # Step 2: Set up environment variables for the deployed agent
    env_vars = {}

    # Configure worker parallelism
    env_vars["NUM_WORKERS"] = "1"

    # Step 3: Create required Google Cloud Storage buckets
    artifacts_bucket_name = (
        f"{deployment_config.project}-{deployment_config.agent_name}-logs-data"
    )

    print(f"📦 Creating artifacts bucket: {artifacts_bucket_name}")

    create_bucket_if_not_exists(
        bucket_name=artifacts_bucket_name,
        project=deployment_config.project,
        location=deployment_config.location,
    )

    # Step 4: Initialize Vertex AI for deployment
    vertexai.init(
        project=deployment_config.project,
        location=deployment_config.location,
        staging_bucket=f"gs://{deployment_config.staging_bucket}",
    )

    # Step 5: Read requirements file
    with open(deployment_config.requirements_file,encoding="utf-8-sig") as f:
        requirements = f.read().strip().split("\n")

    # Step 6: Create the agent engine app
    agent_engine = AgentEngineApp(
        agent=root_agent,
        artifact_service_builder=lambda: GcsArtifactService(
            bucket_name=artifacts_bucket_name
        ),
    )

    # Step 7: Configure the agent for deployment
    agent_config = {
        "agent_engine": agent_engine,
        "display_name": deployment_config.agent_name,
        "description": "A simple goal planning agent",
        "extra_packages": deployment_config.extra_packages,
        "env_vars": env_vars,
        "requirements": requirements,
    }

    # Step 8: Deploy or update the agent
    existing_agents = list(
        agent_engines.list(filter=f"display_name={deployment_config.agent_name}")
    )

    if existing_agents:
        print(f"🔄 Updating existing agent: {deployment_config.agent_name}")
        remote_agent = existing_agents[0].update(**agent_config)
    else:
        print(f"🆕 Creating new agent: {deployment_config.agent_name}")
        remote_agent = agent_engines.create(**agent_config)

    # Step 9: Save deployment metadata
    metadata = {
        "remote_agent_engine_id": remote_agent.resource_name,
        "deployment_timestamp": datetime.datetime.now().isoformat(),
        "agent_name": deployment_config.agent_name,
        "project": deployment_config.project,
        "location": deployment_config.location,
    }

    logs_dir = Path("logs")
    logs_dir.mkdir(exist_ok=True)
    metadata_file = logs_dir / "deployment_metadata.json"

    with open(metadata_file, "w") as f:
        json.dump(metadata, f, indent=2)

    print("✅ Agent deployed successfully!")
    print(f"📄 Deployment metadata saved to: {metadata_file}")
    print(f"🆔 Agent Engine ID: {remote_agent.resource_name}")

    return remote_agent


if __name__ == "__main__":
    print(
        """
    ╔═══════════════════════════════════════════════════════════╗
    ║                                                           ║
    ║   🤖 DEPLOYING AGENT TO VERTEX AI AGENT ENGINE 🤖         ║
    ║                                                           ║
    ╚═══════════════════════════════════════════════════════════╝
    """
    )

    deploy_agent_engine_app()
