"""SMS simulate layer — no network, no cleartext phones in logs."""

from __future__ import annotations

import logging
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.config import get_settings
from app.enums import BloodGroup
from app.models import Donor, Hospital, SmsNotification
from app.notifications import (
    CHANNEL_SIMULATE,
    SimulateSmsSender,
    SmsSendResult,
    build_urgency_sms,
    get_sms_sender,
    send_live_twilio_sms,
    send_urgency_sms,
)


def _force_settings(monkeypatch: pytest.MonkeyPatch, **env: str) -> None:
    for key, value in env.items():
        monkeypatch.setenv(key, value)
    get_settings.cache_clear()


def test_send_urgency_sms_simulate_does_not_call_live(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _force_settings(
        monkeypatch,
        SMS_MODE="simulate",
        TWILIO_ACCOUNT_SID="ACfakeaccountxxxxxxxx",
        TWILIO_AUTH_TOKEN="fake_token_not_a_secret",
        TWILIO_FROM_NUMBER="+15550000000",
    )

    def _boom(**kwargs):  # noqa: ANN003
        raise AssertionError("live Twilio path must not run when SMS_MODE=simulate")

    monkeypatch.setattr("app.notifications.send_live_twilio_sms", _boom)
    result = send_urgency_sms("+22900000001", "SOS Sang 229 demo")
    assert result.ok is True
    assert result.simulated is True
    assert result.channel == CHANNEL_SIMULATE
    assert result.mode == "simulate"
    assert result.status == "simulated"
    assert get_settings().sms_live_enabled() is False
    assert isinstance(get_sms_sender(), SimulateSmsSender)


def test_live_path_not_selected_without_credentials(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _force_settings(
        monkeypatch,
        SMS_MODE="live",
        TWILIO_ACCOUNT_SID="",
        TWILIO_AUTH_TOKEN="",
        TWILIO_FROM_NUMBER="",
    )
    called = {"live": False}

    def _track(**kwargs):  # noqa: ANN003
        called["live"] = True
        return send_live_twilio_sms(**kwargs)

    monkeypatch.setattr("app.notifications.send_live_twilio_sms", _track)
    result = send_urgency_sms("+22900000001", "SOS Sang 229 demo")
    assert called["live"] is False
    assert result.simulated is True
    assert get_settings().effective_sms_mode() == "simulate"


def test_live_stub_invoked_only_when_mode_and_credentials(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _force_settings(
        monkeypatch,
        SMS_MODE="live",
        TWILIO_ACCOUNT_SID="ACfakeaccountxxxxxxxx",
        TWILIO_AUTH_TOKEN="fake_token_not_a_secret",
        TWILIO_FROM_NUMBER="+15550000000",
    )
    called = {"n": 0}

    def _fake_live(**kwargs):  # noqa: ANN003
        called["n"] += 1
        return SmsSendResult(
            ok=False,
            simulated=False,
            channel="sms",
            mode="live",
            status="failed",
            error="live_not_implemented",
        )

    monkeypatch.setattr("app.notifications.send_live_twilio_sms", _fake_live)
    result = send_urgency_sms("+22900000001", "SOS Sang 229 demo")
    assert called["n"] == 1
    assert result.simulated is False
    assert result.mode == "live"
    assert get_settings().sms_live_enabled() is True


def test_simulate_logs_mask_phone_and_omit_body(
    monkeypatch: pytest.MonkeyPatch,
    caplog: pytest.LogCaptureFixture,
) -> None:
    _force_settings(monkeypatch, SMS_MODE="simulate")
    phone = "+22900000001"
    message = build_urgency_sms(
        public_ref="REQ-DEMO-SMS",
        hospital_name="Hopital Demo",
        blood_group_needed="O+",
    )
    with caplog.at_level(logging.INFO):
        send_urgency_sms(phone, message)
    text = caplog.text
    assert phone not in text
    assert "+229" not in text
    assert "O+" not in text
    assert "***0001" in text
    assert "Groupe demandé" not in text


def test_build_urgency_sms_includes_public_fields() -> None:
    body = build_urgency_sms(
        public_ref="REQ-DEMO-SMS",
        hospital_name="Hopital Demo",
        blood_group_needed="O+",
        simulated=True,
    )
    assert "REQ-DEMO-SMS" in body
    assert "Hopital Demo" in body
    assert "O+" in body
    assert "simulation" in body.lower()


def test_alert_create_persists_simulated_notifications(
    client: TestClient,
    db_session: Session,
    monkeypatch: pytest.MonkeyPatch,
    account: dict,
) -> None:
    _force_settings(
        monkeypatch,
        SMS_MODE="simulate",
        TWILIO_ACCOUNT_SID="ACfakeaccountxxxxxxxx",
        TWILIO_AUTH_TOKEN="fake_token_not_a_secret",
        TWILIO_FROM_NUMBER="+15550000000",
    )

    def _boom(**kwargs):  # noqa: ANN003
        raise AssertionError("POST /alerts must not call live Twilio in simulate")

    monkeypatch.setattr("app.notifications.send_live_twilio_sms", _boom)

    hospital = Hospital(
        id=uuid4(),
        name="Hopital Demo",
        city="Zone Demo",
        is_recognized=True,
    )
    donor = Donor(
        id=uuid4(),
        display_name="Donneur Demo",
        blood_group=BloodGroup.O_NEGATIVE,
        phone="+22900000021",
        city="Zone Demo",
        location=None,
        is_available=True,
    )
    db_session.add_all([hospital, donor])
    db_session.commit()

    response = client.post(
        "/alerts",
        json={
            "public_ref": "REQ-DEMO-SMS",
            "blood_group_needed": "O+",
            "patient_display_name": "Patient Demo",
            "hospital_id": str(hospital.id),
        },
        headers=account["headers"],
    )
    assert response.status_code == 201
    body = response.json()
    assert body["notification"]["simulated_count"] == 1
    assert body["notification"]["channel"] == "sms_simulate"
    assert body["notification"]["implemented"] is True
    assert body["notification"]["sent"] is False
    assert "+229" not in response.text
    assert db_session.query(SmsNotification).count() == 1
