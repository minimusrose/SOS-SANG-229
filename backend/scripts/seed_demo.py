"""Insert clearly fictional demo rows.

Never logs phone numbers, GPS coordinates, or blood groups.
Hospitals: one recognized (usable for urgencies) and one not.
Re-running updates hospital flags and skips existing urgency rows.
"""

from __future__ import annotations

import sys
from datetime import datetime, timezone
from pathlib import Path
from uuid import UUID

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from geoalchemy2.elements import WKTElement  # noqa: E402
from sqlalchemy import select  # noqa: E402

from app.db import get_session_factory  # noqa: E402
from app.enums import BloodGroup, DonationStatus, MatchMethod, UrgencyStatus  # noqa: E402
from app.models import (  # noqa: E402
    DonationConfirmation,
    Donor,
    Hospital,
    UrgencyMatch,
    UrgencyRequest,
)
from app.rules import require_recognized_hospital  # noqa: E402

# Fictional Zone Demo point (not a residence or real facility). Do not print.
_DEMO_POINT = WKTElement("POINT(2.42 6.37)", srid=4326)

RECOGNIZED_HOSPITAL_ID = UUID("00000000-0000-4000-8000-000000000010")
UNRECOGNIZED_HOSPITAL_ID = UUID("00000000-0000-4000-8000-000000000011")
DONOR_ID = UUID("00000000-0000-4000-8000-000000000001")
URGENCY_ID = UUID("00000000-0000-4000-8000-000000000020")
MATCH_ID = UUID("00000000-0000-4000-8000-000000000021")
CONFIRM_ID = UUID("00000000-0000-4000-8000-000000000030")
# Backward-compatible alias used by earlier seed revisions.
HOSPITAL_ID = RECOGNIZED_HOSPITAL_ID


def _upsert_hospital(
    session,
    hospital_id: UUID,
    *,
    name: str,
    is_recognized: bool,
) -> Hospital:
    hospital = session.get(Hospital, hospital_id)
    if hospital is None:
        hospital = Hospital(
            id=hospital_id,
            name=name,
            city="Zone Demo",
            location=_DEMO_POINT,
            contact_name="Contact Demo",
            contact_phone="+22900000099",
            is_recognized=is_recognized,
        )
        session.add(hospital)
        return hospital
    hospital.name = name
    hospital.is_recognized = is_recognized
    return hospital


def main() -> None:
    session = get_session_factory()()
    try:
        recognized = _upsert_hospital(
            session,
            RECOGNIZED_HOSPITAL_ID,
            name="Hopital Demo",
            is_recognized=True,
        )
        _upsert_hospital(
            session,
            UNRECOGNIZED_HOSPITAL_ID,
            name="Clinique Demo Non Reconnue",
            is_recognized=False,
        )
        require_recognized_hospital(recognized)

        already = session.scalar(
            select(UrgencyRequest.id).where(UrgencyRequest.public_ref == "REQ-DEMO-001")
        )
        if already is not None:
            session.commit()
            print(
                "Demo seed already present (REQ-DEMO-001). "
                "Hospital recognition flags refreshed. "
                "Sensitive fields are not printed."
            )
            return

        if session.get(Donor, DONOR_ID) is None:
            session.add(
                Donor(
                    id=DONOR_ID,
                    display_name="Donneur Demo",
                    blood_group=BloodGroup.O_POSITIVE,
                    phone="+22900000000",
                    city="Zone Demo",
                    location=_DEMO_POINT,
                    is_available=True,
                )
            )

        session.add(
            UrgencyRequest(
                id=URGENCY_ID,
                public_ref="REQ-DEMO-001",
                blood_group_needed=BloodGroup.O_POSITIVE,
                patient_display_name="Patient Demo",
                hospital_id=RECOGNIZED_HOSPITAL_ID,
                status=UrgencyStatus.ALERTING,
                units_needed=1,
                zone_label="Zone Demo",
                alerted_donors_count=1,
                confirmed_donations_count=1,
            )
        )
        session.add(
            UrgencyMatch(
                id=MATCH_ID,
                urgency_request_id=URGENCY_ID,
                donor_id=DONOR_ID,
                match_method=MatchMethod.GPS,
            )
        )
        session.add(
            DonationConfirmation(
                id=CONFIRM_ID,
                donor_id=DONOR_ID,
                urgency_request_id=URGENCY_ID,
                status=DonationStatus.CONFIRMED,
                confirmed_at=datetime.now(timezone.utc),
            )
        )
        session.commit()
        print(
            "Inserted fictional demo rows "
            "(Donneur Demo, Hopital Demo recognized, "
            "Clinique Demo Non Reconnue, REQ-DEMO-001). "
            "Sensitive fields are not printed."
        )
    finally:
        session.close()


if __name__ == "__main__":
    main()
