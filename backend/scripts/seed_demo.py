"""Insert clearly fictional demo rows.

Never logs phone numbers, GPS coordinates, or blood groups.
Re-running is a no-op once REQ-DEMO-001 exists.
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
from app.enums import BloodGroup, DonationStatus, UrgencyStatus  # noqa: E402
from app.models import DonationConfirmation, Donor, Hospital, UrgencyRequest  # noqa: E402

# Fictional Zone Demo point (not a residence or real facility). Do not print.
_DEMO_POINT = WKTElement("POINT(2.42 6.37)", srid=4326)

HOSPITAL_ID = UUID("00000000-0000-4000-8000-000000000010")
DONOR_ID = UUID("00000000-0000-4000-8000-000000000001")
URGENCY_ID = UUID("00000000-0000-4000-8000-000000000020")
CONFIRM_ID = UUID("00000000-0000-4000-8000-000000000030")


def main() -> None:
    session = get_session_factory()()
    try:
        already = session.scalar(
            select(UrgencyRequest.id).where(UrgencyRequest.public_ref == "REQ-DEMO-001")
        )
        if already is not None:
            print("Demo seed already present (REQ-DEMO-001). Skipping.")
            return

        session.add_all(
            [
                Hospital(
                    id=HOSPITAL_ID,
                    name="Hopital Demo",
                    city="Zone Demo",
                    location=_DEMO_POINT,
                    contact_name="Contact Demo",
                    contact_phone="+22900000099",
                ),
                Donor(
                    id=DONOR_ID,
                    display_name="Donneur Demo",
                    blood_group=BloodGroup.O_POSITIVE,
                    phone="+22900000000",
                    city="Zone Demo",
                    location=_DEMO_POINT,
                    is_available=True,
                ),
                UrgencyRequest(
                    id=URGENCY_ID,
                    public_ref="REQ-DEMO-001",
                    blood_group_needed=BloodGroup.O_POSITIVE,
                    patient_display_name="Patient Demo",
                    hospital_id=HOSPITAL_ID,
                    status=UrgencyStatus.ALERTING,
                    units_needed=1,
                    zone_label="Zone Demo",
                    alerted_donors_count=1,
                    confirmed_donations_count=1,
                ),
                DonationConfirmation(
                    id=CONFIRM_ID,
                    donor_id=DONOR_ID,
                    urgency_request_id=URGENCY_ID,
                    status=DonationStatus.CONFIRMED,
                    confirmed_at=datetime.now(timezone.utc),
                ),
            ]
        )
        session.commit()
        print(
            "Inserted fictional demo rows "
            "(Donneur Demo, Hopital Demo, REQ-DEMO-001). "
            "Sensitive fields are not printed."
        )
    finally:
        session.close()


if __name__ == "__main__":
    main()
