"""API tests with fictional data only. Phone/GPS are never asserted in cleartext."""

from __future__ import annotations

from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.enums import BloodGroup
from app.models import Donor, Hospital
from app.rules import UnrecognizedHospitalError, require_recognized_hospital


def _recognized_hospital(db: Session, city: str = "Zone Demo") -> Hospital:
    hospital = Hospital(id=uuid4(), name="Hopital Demo", city=city, is_recognized=True)
    db.add(hospital)
    db.commit()
    db.refresh(hospital)
    return hospital


def _unrecognized_hospital(db: Session) -> Hospital:
    hospital = Hospital(
        id=uuid4(),
        name="Clinique Demo Non Reconnue",
        city="Zone Demo",
        is_recognized=False,
    )
    db.add(hospital)
    db.commit()
    db.refresh(hospital)
    return hospital


def _donor(
    db: Session,
    *,
    city: str = "Zone Demo",
    blood_group: BloodGroup = BloodGroup.O_POSITIVE,
    available: bool = True,
    phone: str = "+22900000000",
    name: str = "Donneur Demo",
    user_id=None,
) -> Donor:
    donor = Donor(
        id=uuid4(),
        user_id=user_id,
        display_name=name,
        blood_group=blood_group,
        phone=phone,
        city=city,
        location=None,
        is_available=available,
    )
    db.add(donor)
    db.commit()
    db.refresh(donor)
    return donor


# --- health / openapi -------------------------------------------------------


def test_health_ok(api_client: TestClient) -> None:
    response = api_client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_openapi_lists_business_paths(api_client: TestClient) -> None:
    spec = api_client.get("/openapi.json").json()
    paths = spec["paths"]
    for path in (
        "/health",
        "/auth/register",
        "/auth/login",
        "/auth/me",
        "/hospitals",
        "/hospitals/recognized",
        "/donors",
        "/alerts",
        "/donations",
        "/me/requests",
        "/me/matches",
        "/requests/{public_ref}",
    ):
        assert path in paths, path
    assert "/requests" not in paths  # global list removed
    schemas = spec["components"]["schemas"]
    assert "phone" not in schemas["HospitalPublic"]["properties"]
    assert "phone" not in schemas["DonorPublic"]["properties"]
    assert "phone" not in schemas["UrgencyTrackingRead"]["properties"]


# --- auth -----------------------------------------------------------------


def test_auth_register_login_me(client: TestClient) -> None:
    reg = client.post(
        "/auth/register",
        json={"phone": "+22900002001", "password": "motdepasse", "display_name": "Awa K."},
    )
    assert reg.status_code == 201
    body = reg.json()
    assert body["user"]["display_name"] == "Awa K."
    assert body["user"]["has_donor_profile"] is False
    assert "password" not in reg.text

    dup = client.post(
        "/auth/register",
        json={"phone": "+22900002001", "password": "autrepass", "display_name": "X"},
    )
    assert dup.status_code == 409

    ok = client.post(
        "/auth/login",
        json={"phone": "+22900002001", "password": "motdepasse"},
    )
    assert ok.status_code == 200
    token = ok.json()["token"]

    bad = client.post(
        "/auth/login",
        json={"phone": "+22900002001", "password": "mauvais"},
    )
    assert bad.status_code == 401

    me = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["display_name"] == "Awa K."
    assert client.get("/auth/me").status_code == 401


def test_protected_endpoints_require_a_token(client: TestClient) -> None:
    assert client.post("/donors", json={"blood_group": "O+", "city": "Cotonou"}).status_code == 401
    assert client.post(
        "/alerts",
        json={
            "blood_group_needed": "O+",
            "patient_display_name": "A. K.",
            "hospital_id": str(uuid4()),
        },
    ).status_code == 401
    assert client.post(
        "/donations", json={"urgency_request_id": str(uuid4())}
    ).status_code == 401
    assert client.get("/me/requests").status_code == 401
    assert client.get("/me/matches").status_code == 401


# --- hospitals ----------------------------------------------------------------


def test_list_recognized_hospitals_omits_unrecognized(
    client: TestClient,
    db_session: Session,
) -> None:
    recognized = _recognized_hospital(db_session)
    _unrecognized_hospital(db_session)

    response = client.get("/hospitals/recognized")
    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["id"] == str(recognized.id)
    assert "contact_phone" not in body[0]
    assert "phone" not in body[0]


# --- donors -----------------------------------------------------------------


def test_register_donor_omits_phone(client: TestClient, account: dict) -> None:
    response = client.post(
        "/donors",
        json={"display_name": "Awa K.", "blood_group": "O+", "city": "Cotonou"},
        headers=account["headers"],
    )
    assert response.status_code == 201
    body = response.json()
    assert body["display_name"] == "Awa K."
    assert body["city"] == "Cotonou"
    assert "phone" not in body
    assert "location" not in body

    me = client.get("/auth/me", headers=account["headers"])
    assert me.json()["has_donor_profile"] is True


def test_second_donor_profile_for_account_conflicts(
    client: TestClient,
    account: dict,
) -> None:
    first = client.post(
        "/donors",
        json={"blood_group": "O+", "city": "Cotonou"},
        headers=account["headers"],
    )
    assert first.status_code == 201
    second = client.post(
        "/donors",
        json={"blood_group": "A+", "city": "Cotonou"},
        headers=account["headers"],
    )
    assert second.status_code == 409
    assert "+229" not in second.text


# --- alerts -----------------------------------------------------------------


def test_create_urgency_rejects_unrecognized_hospital(
    client: TestClient,
    db_session: Session,
    account: dict,
) -> None:
    hospital = _unrecognized_hospital(db_session)
    response = client.post(
        "/alerts",
        json={
            "public_ref": "REQ-DEMO-UNREC",
            "blood_group_needed": "O+",
            "patient_display_name": "A. K.",
            "hospital_id": str(hospital.id),
        },
        headers=account["headers"],
    )
    assert response.status_code == 400
    assert "recognized" in response.json()["detail"].lower()


def test_create_urgency_rejects_missing_hospital(
    client: TestClient,
    account: dict,
) -> None:
    response = client.post(
        "/alerts",
        json={
            "blood_group_needed": "O+",
            "patient_display_name": "A. K.",
            "hospital_id": str(uuid4()),
        },
        headers=account["headers"],
    )
    assert response.status_code == 404


def test_create_urgency_duplicate_public_ref_conflict(
    client: TestClient,
    db_session: Session,
    account: dict,
) -> None:
    hospital = _recognized_hospital(db_session)
    payload = {
        "public_ref": "REQ-DEMO-DUP",
        "blood_group_needed": "O+",
        "patient_display_name": "A. K.",
        "hospital_id": str(hospital.id),
    }
    first = client.post("/alerts", json=payload, headers=account["headers"])
    assert first.status_code == 201
    second = client.post("/alerts", json=payload, headers=account["headers"])
    assert second.status_code == 409
    assert "public_ref" in second.json()["detail"].lower()


def test_create_urgency_matches_compatible_city_donor(
    client: TestClient,
    db_session: Session,
    account: dict,
) -> None:
    hospital = _recognized_hospital(db_session, city="Zone Demo")
    nearby = _donor(
        db_session,
        city="Zone Demo",
        blood_group=BloodGroup.O_NEGATIVE,
        phone="+22900000001",
        name="Donneur Compatible",
    )
    _donor(
        db_session,
        city="Ville Demo",
        blood_group=BloodGroup.O_NEGATIVE,
        phone="+22900000002",
        name="Donneur Loin",
    )
    _donor(
        db_session,
        city="Zone Demo",
        blood_group=BloodGroup.A_POSITIVE,
        phone="+22900000003",
        name="Donneur Incompatible",
    )

    response = client.post(
        "/alerts",
        json={
            "public_ref": "REQ-DEMO-MATCH",
            "blood_group_needed": "O+",
            "patient_display_name": "A. K.",
            "hospital_id": str(hospital.id),
            "zone_label": "Zone Demo",
        },
        headers=account["headers"],
    )
    assert response.status_code == 201
    body = response.json()
    assert body["alerted_donors_count"] == 1
    assert body["status"] == "alerting"
    assert body["matching"]["match_count"] == 1
    # The requester gets a count only — never donor identities.
    assert "candidates" not in body["matching"]
    assert str(nearby.id) not in response.text
    assert "Donneur Compatible" not in response.text
    assert body["notification"]["simulated_count"] == 1
    assert "+229" not in response.text


def test_create_urgency_matches_gps_donor_inside_radius(
    client: TestClient,
    db_session: Session,
    account: dict,
) -> None:
    from app.geo import geopoint_to_wkt
    from app.schemas.common import GeoPoint

    hospital = Hospital(
        id=uuid4(),
        name="Hopital Demo",
        city="Zone Demo",
        is_recognized=True,
        location=geopoint_to_wkt(GeoPoint(latitude=6.37, longitude=2.42)),
    )
    db_session.add(hospital)
    nearby = Donor(
        id=uuid4(),
        display_name="Donneur Proche",
        blood_group=BloodGroup.O_NEGATIVE,
        phone="+22900000011",
        city="Autre Ville Demo",
        location=geopoint_to_wkt(GeoPoint(latitude=6.38, longitude=2.42)),
        is_available=True,
    )
    far = Donor(
        id=uuid4(),
        display_name="Donneur Loin",
        blood_group=BloodGroup.O_NEGATIVE,
        phone="+22900000012",
        city="Zone Demo",
        location=geopoint_to_wkt(GeoPoint(latitude=6.60, longitude=2.42)),
        is_available=True,
    )
    db_session.add_all([nearby, far])
    db_session.commit()

    response = client.post(
        "/alerts",
        json={
            "public_ref": "REQ-DEMO-GPS",
            "blood_group_needed": "O+",
            "patient_display_name": "A. K.",
            "hospital_id": str(hospital.id),
        },
        headers=account["headers"],
    )
    assert response.status_code == 201
    body = response.json()
    assert body["alerted_donors_count"] == 1
    assert body["matching"]["match_count"] == 1
    assert "candidates" not in body["matching"]
    assert str(nearby.id) not in response.text
    assert str(far.id) not in response.text
    assert "+229" not in response.text


# --- personalised views + confirm -----------------------------------------


def test_me_requests_are_scoped_to_the_owner(
    client: TestClient,
    db_session: Session,
    make_account,
) -> None:
    hospital = _recognized_hospital(db_session)
    requester = make_account(name="Demandeur")
    other = make_account(name="Autre")

    created = client.post(
        "/alerts",
        json={
            "public_ref": "REQ-DEMO-MINE",
            "blood_group_needed": "O+",
            "patient_display_name": "A. K.",
            "hospital_id": str(hospital.id),
        },
        headers=requester["headers"],
    )
    assert created.status_code == 201

    mine = client.get("/me/requests", headers=requester["headers"])
    assert mine.status_code == 200
    assert [r["public_ref"] for r in mine.json()] == ["REQ-DEMO-MINE"]
    assert mine.json()[0]["blood_group_needed"] == "O+"

    assert client.get("/me/requests", headers=other["headers"]).json() == []


def test_me_matches_empty_without_donor_profile(
    client: TestClient,
    account: dict,
) -> None:
    resp = client.get("/me/matches", headers=account["headers"])
    assert resp.status_code == 200
    assert resp.json() == []


def test_donor_profile_read_and_update(client: TestClient, account: dict) -> None:
    assert client.get(
        "/me/donor-profile", headers=account["headers"]
    ).status_code == 404  # no donor profile yet

    client.post(
        "/donors",
        json={"display_name": "Awa K.", "blood_group": "O+", "city": "Cotonou"},
        headers=account["headers"],
    )

    read = client.get("/me/donor-profile", headers=account["headers"])
    assert read.status_code == 200
    assert read.json() == {
        "display_name": "Awa K.",
        "phone": account["phone"],
        "blood_group": "O+",
        "city": "Cotonou",
        "has_location": False,
    }

    upd = client.patch(
        "/me/donor-profile",
        json={"display_name": "Awa Koffi", "blood_group": "A+", "city": "Parakou"},
        headers=account["headers"],
    )
    assert upd.status_code == 200
    assert upd.json()["display_name"] == "Awa Koffi"
    assert upd.json()["blood_group"] == "A+"
    assert upd.json()["city"] == "Parakou"

    # the account name is kept in sync for /auth/me
    assert (
        client.get("/auth/me", headers=account["headers"]).json()["display_name"]
        == "Awa Koffi"
    )


def test_donor_location_is_captured_but_never_returned(
    client: TestClient,
    account: dict,
) -> None:
    created = client.post(
        "/donors",
        json={
            "blood_group": "O+",
            "city": "Cotonou",
            "location": {"latitude": 6.37, "longitude": 2.42},
        },
        headers=account["headers"],
    )
    assert created.status_code == 201
    assert "location" not in created.json()  # DonorPublic omits GPS

    read = client.get("/me/donor-profile", headers=account["headers"])
    assert read.json()["has_location"] is True
    assert "location" not in read.json()
    assert "6.37" not in read.text and "2.42" not in read.text


def test_donor_location_added_via_profile_update(
    client: TestClient,
    account: dict,
) -> None:
    client.post(
        "/donors",
        json={"blood_group": "O+", "city": "Cotonou"},
        headers=account["headers"],
    )
    assert (
        client.get("/me/donor-profile", headers=account["headers"]).json()[
            "has_location"
        ]
        is False
    )

    upd = client.patch(
        "/me/donor-profile",
        json={"location": {"latitude": 9.34, "longitude": 2.63}},
        headers=account["headers"],
    )
    assert upd.status_code == 200
    assert upd.json()["has_location"] is True
    assert "9.34" not in upd.text and "2.63" not in upd.text


def test_full_flow_match_confirm_increments_requester_count(
    client: TestClient,
    db_session: Session,
    make_account,
) -> None:
    hospital = _recognized_hospital(db_session, city="Zone Demo")
    requester = make_account(name="Demandeur")
    donor_acc = make_account(name="Donneur")

    prof = client.post(
        "/donors",
        json={"blood_group": "O-", "city": "Zone Demo"},
        headers=donor_acc["headers"],
    )
    assert prof.status_code == 201

    created = client.post(
        "/alerts",
        json={
            "public_ref": "REQ-DEMO-FLOW",
            "blood_group_needed": "O+",
            "patient_display_name": "A. K.",
            "hospital_id": str(hospital.id),
        },
        headers=requester["headers"],
    )
    assert created.status_code == 201
    urgency_id = created.json()["id"]
    assert created.json()["alerted_donors_count"] == 1

    matches = client.get("/me/matches", headers=donor_acc["headers"])
    assert matches.status_code == 200
    assert len(matches.json()) == 1
    assert matches.json()[0]["public_ref"] == "REQ-DEMO-FLOW"
    assert matches.json()[0]["i_confirmed"] is False

    # A random donor account that was not matched cannot confirm.
    stranger = make_account(name="Etranger")
    client.post(
        "/donors",
        json={"blood_group": "O-", "city": "Ailleurs"},
        headers=stranger["headers"],
    )
    forbidden = client.post(
        "/donations",
        json={"urgency_request_id": urgency_id},
        headers=stranger["headers"],
    )
    assert forbidden.status_code == 403

    confirm = client.post(
        "/donations",
        json={"urgency_request_id": urgency_id},
        headers=donor_acc["headers"],
    )
    assert confirm.status_code == 201
    assert confirm.json()["status"] == "confirmed"

    tracking = client.get("/requests/REQ-DEMO-FLOW", headers=requester["headers"])
    assert tracking.status_code == 200
    assert tracking.json()["confirmed_donations_count"] == 1
    assert tracking.json()["status"] == "fulfilled"

    again = client.post(
        "/donations",
        json={"urgency_request_id": urgency_id},
        headers=donor_acc["headers"],
    )
    assert again.status_code == 409

    matches_after = client.get("/me/matches", headers=donor_acc["headers"])
    assert matches_after.json()[0]["i_confirmed"] is True


def test_request_detail_forbidden_for_unrelated_account(
    client: TestClient,
    db_session: Session,
    make_account,
) -> None:
    hospital = _recognized_hospital(db_session)
    requester = make_account(name="Demandeur")
    nosy = make_account(name="Curieux")

    client.post(
        "/alerts",
        json={
            "public_ref": "REQ-DEMO-PRIV",
            "blood_group_needed": "O+",
            "patient_display_name": "A. K.",
            "hospital_id": str(hospital.id),
        },
        headers=requester["headers"],
    )
    assert client.get(
        "/requests/REQ-DEMO-PRIV", headers=nosy["headers"]
    ).status_code == 403
    assert client.get(
        "/requests/REQ-DEMO-PRIV", headers=requester["headers"]
    ).status_code == 200


def test_require_recognized_hospital_helper() -> None:
    recognized = Hospital(name="Hopital Demo", city="Zone Demo", is_recognized=True)
    unrecognized = Hospital(
        name="Clinique Demo Non Reconnue",
        city="Zone Demo",
        is_recognized=False,
    )
    require_recognized_hospital(recognized)
    try:
        require_recognized_hospital(unrecognized)
    except UnrecognizedHospitalError:
        return
    raise AssertionError("unrecognized hospital must be rejected")
