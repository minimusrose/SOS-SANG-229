"""Text-normalization helpers shared by server-side duplicate checks."""

import re
import unicodedata


def normalize_patient_name(value: str) -> str:
    """Case-, accent-, and whitespace-insensitive form of a patient name:
    strips diacritics, collapses runs of whitespace, trims, and casefolds."""
    decomposed = unicodedata.normalize("NFKD", value or "")
    without_marks = "".join(ch for ch in decomposed if not unicodedata.combining(ch))
    collapsed = re.sub(r"\s+", " ", without_marks.strip())
    return collapsed.casefold()
