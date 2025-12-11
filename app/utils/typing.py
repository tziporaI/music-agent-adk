from typing import (
    Literal,
)

from pydantic import (
    BaseModel,
)


class Feedback(BaseModel):
    """Represents feedback for a conversation."""

    score: int | float
    text: str | None = ""
    invocation_id: str
    log_type: Literal["feedback"] = "feedback"
    service_name: str = "adk-agent"
    user_id: str = ""
