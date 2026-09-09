"""SMS / alert notifications.

Twilio is out of scope for this PR. This module is an interface stub so a
later simulation can plug in without sending real SMS or storing secrets.
Never log phone numbers, GPS, or blood groups.
"""

from __future__ import annotations

import logging
from typing import Protocol

logger = logging.getLogger(__name__)


class AlertNotifier(Protocol):
    def notify_matched_donors(self, *, donor_count: int) -> None:
        """Notify matched donors. Implementations must not receive raw phones."""


class StubSmsNotifier:
    """No-op notifier. Does not call Twilio and does not send SMS."""

    def notify_matched_donors(self, *, donor_count: int) -> None:
        # TODO: later simulation may enqueue fictional alerts here.
        # Do not add TWILIO_* usage or real recipient lists.
        logger.info(
            "SMS stub: would notify %s donor(s) (no SMS sent, no PII logged)",
            donor_count,
        )


def default_notifier() -> StubSmsNotifier:
    return StubSmsNotifier()
