"""Export the ABO/Rh compatibility table for the frontend "Testez votre
compatibilité" widget.

Single source of truth is ``app.matching._COMPATIBLE_DONORS`` (used in
production for urgency matching). This script is the ONLY way the frontend's
static lookup table should be produced — never hand-edit the generated JSON.
Re-run it whenever ``_COMPATIBLE_DONORS`` changes:

    cd backend && python scripts/export_blood_compatibility.py

``backend/tests/test_matching.py`` fails the build if the committed JSON
drifts from the live table, so a forgotten re-run is caught in CI/tests
rather than silently shipping a stale rule to the browser.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.enums import BloodGroup  # noqa: E402
from app.matching import compatible_donor_groups  # noqa: E402

OUTPUT_PATH = (
    BACKEND_DIR.parent / "frontend" / "src" / "data" / "bloodCompatibility.generated.json"
)


def build_pairs() -> list[dict[str, object]]:
    pairs: list[dict[str, object]] = []
    for recipient in BloodGroup:
        donors = compatible_donor_groups(recipient)
        for donor in BloodGroup:
            pairs.append(
                {
                    "donor": donor.value,
                    "recipient": recipient.value,
                    "compatible": donor in donors,
                }
            )
    return pairs


def main() -> None:
    payload = {
        "//": (
            "GENERATED FILE — do not edit by hand. Source of truth: "
            "backend/app/matching.py:_COMPATIBLE_DONORS. Regenerate with "
            "`python backend/scripts/export_blood_compatibility.py`."
        ),
        "pairs": build_pairs(),
    }
    OUTPUT_PATH.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {len(payload['pairs'])} pairs to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
