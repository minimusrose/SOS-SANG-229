"""Helpers so API responses do not leak full phone numbers."""


def mask_phone(phone: str) -> str:
    """Keep only the last 4 digits (e.g. ***0001). Prefer omitting phone."""
    digits = "".join(ch for ch in phone if ch.isdigit())
    if len(digits) < 2:
        return "**"
    keep = digits[-4:] if len(digits) >= 4 else digits[-2:]
    return f"***{keep}"
