"""SMS notifications after urgency matching.

Default ``SMS_MODE=simulate``: record a simulated success, never call Twilio.
Live stays off unless ``SMS_MODE=live`` AND Twilio credentials are present.
The live path is a local stub (no HTTP) so default/dev cannot hit the network.

Never log full phone numbers, GPS, or blood groups.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Protocol
from uuid import UUID, uuid4

from sqlalchemy.orm import Session

from app.config import SMS_MODE_LIVE, SMS_MODE_SIMULATE, Settings, get_settings
from app.privacy import mask_phone

logger = logging.getLogger(__name__)

CHANNEL_SIMULATE = "sms_simulate"
CHANNEL_LIVE = "sms"
STATUS_SIMULATED = "simulated"
STATUS_SENT = "sent"
STATUS_FAILED = "failed"
STATUS_SKIPPED = "skipped"


@dataclass(frozen=True)
class SmsSendResult:
    """Outcome of one ``send_urgency_sms`` call. Do not put raw phones here."""

    ok: bool
    simulated: bool
    channel: str
    mode: str
    status: str
    error: str | None = None


@dataclass(frozen=True)
class NotificationSummaryData:
    channel: str
    mode: str
    implemented: bool
    sent: bool
    simulated_count: int
    attempted_count: int
    failed_count: int
    live_enabled: bool


class SmsSender(Protocol):
    def send_urgency_sms(self, to_phone: str, message: str) -> SmsSendResult:
        """Send or simulate one urgency SMS. Implementations must not log PII."""


def build_urgency_sms(
    *,
    public_ref: str,
    hospital_name: str,
    blood_group_needed: str,
    simulated: bool = True,
) -> str:
    """Public alert body. No patient name. Do not log this string (blood group)."""
    suffix = " (simulation — aucun SMS réel)" if simulated else ""
    return (
        f"SOS Sang 229: urgence {public_ref} à {hospital_name}. "
        f"Groupe demandé : {blood_group_needed}. "
        f"Répondez si vous pouvez donner.{suffix}"
    )


def send_live_twilio_sms(
    *,
    to_phone: str,
    message: str,
    account_sid: str,
    auth_token: str,
    from_number: str,
) -> SmsSendResult:
    """Live Twilio hook.

    Isolated so tests can assert it is never called in simulate mode.
    This MVP does not open a network socket even when selected.
    Credentials and full phones must not be logged.
    """
    del account_sid, auth_token, from_number, message
    logger.warning(
        "SMS live stub invoked for %s (no Twilio HTTP, live send not implemented)",
        mask_phone(to_phone),
    )
    return SmsSendResult(
        ok=False,
        simulated=False,
        channel=CHANNEL_LIVE,
        mode=SMS_MODE_LIVE,
        status=STATUS_FAILED,
        error="live_not_implemented",
    )


class SimulateSmsSender:
    """Records a simulated success. Never calls Twilio."""

    def send_urgency_sms(self, to_phone: str, message: str) -> SmsSendResult:
        del message
        logger.info(
            "SMS simulate: recorded success for %s (no network, no body logged)",
            mask_phone(to_phone),
        )
        return SmsSendResult(
            ok=True,
            simulated=True,
            channel=CHANNEL_SIMULATE,
            mode=SMS_MODE_SIMULATE,
            status=STATUS_SIMULATED,
        )


class LiveTwilioSender:
    """Gated live path. Instantiated only when live + credentials are set."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    def send_urgency_sms(self, to_phone: str, message: str) -> SmsSendResult:
        return send_live_twilio_sms(
            to_phone=to_phone,
            message=message,
            account_sid=self._settings.twilio_account_sid,
            auth_token=self._settings.twilio_auth_token.get_secret_value(),
            from_number=self._settings.twilio_from_number,
        )


def get_sms_sender(settings: Settings | None = None) -> SmsSender:
    cfg = settings or get_settings()
    if cfg.sms_live_enabled():
        return LiveTwilioSender(cfg)
    return SimulateSmsSender()


def send_urgency_sms(to_phone: str, message: str) -> SmsSendResult:
    """Public notification interface used after matching."""
    return get_sms_sender().send_urgency_sms(to_phone, message)


def summarize_results(
    results: list[SmsSendResult],
    *,
    settings: Settings | None = None,
) -> NotificationSummaryData:
    cfg = settings or get_settings()
    live_enabled = cfg.sms_live_enabled()
    mode = cfg.effective_sms_mode()
    channel = CHANNEL_LIVE if live_enabled else CHANNEL_SIMULATE
    simulated_count = sum(1 for item in results if item.simulated and item.ok)
    failed_count = sum(1 for item in results if item.status == STATUS_FAILED)
    sent_count = sum(1 for item in results if item.status == STATUS_SENT)
    return NotificationSummaryData(
        channel=channel,
        mode=mode,
        implemented=not live_enabled,
        sent=sent_count > 0,
        simulated_count=simulated_count,
        attempted_count=len(results),
        failed_count=failed_count,
        live_enabled=live_enabled,
    )


def notify_matched_donors(
    session: Session,
    *,
    urgency_id: UUID,
    matches: list,
    public_ref: str,
    hospital_name: str,
    blood_group_needed: str,
) -> NotificationSummaryData:
    """Simulate (or gated live-stub) one SMS per match and persist outcomes.

    ``matches`` items must expose ``.donor.id`` and ``.donor.phone``.
    """
    from app.models import SmsNotification

    settings = get_settings()
    sender = get_sms_sender(settings)
    simulated = not settings.sms_live_enabled()
    results: list[SmsSendResult] = []

    for match in matches:
        message = build_urgency_sms(
            public_ref=public_ref,
            hospital_name=hospital_name,
            blood_group_needed=blood_group_needed,
            simulated=simulated,
        )
        result = sender.send_urgency_sms(match.donor.phone, message)
        results.append(result)
        session.add(
            SmsNotification(
                id=uuid4(),
                urgency_request_id=urgency_id,
                donor_id=match.donor.id,
                channel=result.channel,
                mode=result.mode,
                status=result.status,
            )
        )

    summary = summarize_results(results, settings=settings)
    logger.info(
        "SMS batch: mode=%s channel=%s attempted=%s simulated=%s failed=%s "
        "(no PII logged)",
        summary.mode,
        summary.channel,
        summary.attempted_count,
        summary.simulated_count,
        summary.failed_count,
    )
    return summary


def empty_notification_summary(
    settings: Settings | None = None,
) -> NotificationSummaryData:
    return summarize_results([], settings=settings)


# Backwards-compatible alias used by older call sites / docs.
class StubSmsNotifier:
    def notify_matched_donors(self, *, donor_count: int) -> None:
        logger.info(
            "SMS stub alias: %s donor(s) — use notify_matched_donors() instead",
            donor_count,
        )


def default_notifier() -> StubSmsNotifier:
    return StubSmsNotifier()
