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


import httpx

def send_live_robase_sms(
    *,
    to_phone: str,
    message: str,
    api_key: str,
    sender_id: str,
) -> SmsSendResult:
    """Live Robase API implementation."""
    url = "https://api.robase.dev/v1/sms/send"
    
    # Using httpx synchronously since this function runs synchronously,
    # or you can use a fire-and-forget background task in the router.
    # For MVP we keep it simple blocking request.
    try:
        response = httpx.post(
            url,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "phone_number": to_phone,
                "message": message,
                "sender": sender_id,
            },
            timeout=10.0
        )
        response.raise_for_status()
        
        logger.info(
            "SMS live Robase success for %s",
            mask_phone(to_phone),
        )
        return SmsSendResult(
            ok=True,
            simulated=False,
            channel=CHANNEL_LIVE,
            mode=SMS_MODE_LIVE,
            status=STATUS_SENT,
        )
    except Exception as e:
        logger.error(
            "SMS live Robase failed for %s: %s",
            mask_phone(to_phone),
            str(e)
        )
        return SmsSendResult(
            ok=False,
            simulated=False,
            channel=CHANNEL_LIVE,
            mode=SMS_MODE_LIVE,
            status=STATUS_FAILED,
            error=str(e),
        )


class SimulateSmsSender:
    """Records a simulated success. Never hits network."""

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


class LiveRobaseSender:
    """Gated live path for Robase."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    def send_urgency_sms(self, to_phone: str, message: str) -> SmsSendResult:
        return send_live_robase_sms(
            to_phone=to_phone,
            message=message,
            api_key=self._settings.robase_api_key.get_secret_value(),
            sender_id=self._settings.robase_sender_id,
        )


def get_sms_sender(settings: Settings | None = None) -> SmsSender:
    cfg = settings or get_settings()
    if cfg.sms_live_enabled():
        return LiveRobaseSender(cfg)
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
