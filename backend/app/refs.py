"""Public tracking references. Not secrets; still avoid logging with PII."""

from uuid import uuid4


def new_public_ref() -> str:
    return f"REQ-{uuid4().hex[:8].upper()}"
