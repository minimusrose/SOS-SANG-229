"""Derived display-status for an urgency request.

Mirrors frontend/src/lib/status.js::displayStatus() exactly (confirmed vs.
needed ratio, not the raw lifecycle status) — this is the single "non
pourvue" definition reused by the duplicate-patient guard in app/duplicates.py.
Keep both sides in sync if the ratio rule ever changes.
"""

from app.enums import UrgencyStatus


def display_status(
    status: UrgencyStatus, confirmed_donations_count: int, units_needed: int
) -> str:
    if status == UrgencyStatus.CANCELLED:
        return "cancelled"
    confirmed = confirmed_donations_count or 0
    needed = units_needed or 1
    if confirmed <= 0:
        return "open"
    if confirmed < needed:
        return "alerting"
    return "fulfilled"
