"""Persist urgency matching candidates (no PII columns).

Revision ID: 003_urgency_matches
Revises: 002_hospital_recognized
Create Date: 2026-09-09
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "003_urgency_matches"
down_revision: Union[str, Sequence[str], None] = "002_hospital_recognized"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

MATCH_METHOD_VALUES = ("gps", "city")


def upgrade() -> None:
    match_method = postgresql.ENUM(*MATCH_METHOD_VALUES, name="match_method")
    match_method.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "urgency_matches",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("urgency_request_id", sa.Uuid(), nullable=False),
        sa.Column("donor_id", sa.Uuid(), nullable=False),
        sa.Column(
            "match_method",
            postgresql.ENUM(*MATCH_METHOD_VALUES, name="match_method", create_type=False),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["urgency_request_id"],
            ["urgency_requests.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(["donor_id"], ["donors.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "urgency_request_id",
            "donor_id",
            name="uq_urgency_matches_urgency_donor",
        ),
        comment="Matched donors for an urgency. No phone/GPS/blood group columns.",
    )
    op.create_index(
        "ix_urgency_matches_urgency_request_id",
        "urgency_matches",
        ["urgency_request_id"],
    )
    op.create_index("ix_urgency_matches_donor_id", "urgency_matches", ["donor_id"])


def downgrade() -> None:
    op.drop_index("ix_urgency_matches_donor_id", table_name="urgency_matches")
    op.drop_index("ix_urgency_matches_urgency_request_id", table_name="urgency_matches")
    op.drop_table("urgency_matches")
    postgresql.ENUM(name="match_method").drop(op.get_bind(), checkfirst=True)
