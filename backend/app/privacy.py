"""Helpers so API responses do not leak full phone numbers."""


def mask_phone(phone: str) -> str:
    """Keep only the last 2 digits. Prefer omitting phone instead of masking."""
    digits = "".join(ch for ch in phone if ch.isdigit())
    if len(digits) < 2:
        return "**"
    return f"***{digits[-2:]}"
