"""Persist SMS notification outcomes (no PII columns).

Revision ID: 004_sms_notifications
Revises: 003_urgency_matches
Create Date: 2026-09-10
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "004_sms_notifications"
down_revision: Union[str, Sequence[str], None] = "003_urgency_matches"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "sms_notifications",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("urgency_request_id", sa.Uuid(), nullable=False),
        sa.Column("donor_id", sa.Uuid(), nullable=False),
        sa.Column("channel", sa.String(length=32), nullable=False),
        sa.Column("mode", sa.String(length=16), nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False),
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
            name="uq_sms_notifications_urgency_donor",
        ),
        comment=(
            "SMS outcomes for an urgency. No phone, GPS, blood group, "
            "or message body columns."
        ),
    )
    op.create_index(
        "ix_sms_notifications_urgency_request_id",
        "sms_notifications",
        ["urgency_request_id"],
    )
    op.create_index("ix_sms_notifications_donor_id", "sms_notifications", ["donor_id"])


def downgrade() -> None:
    op.drop_index("ix_sms_notifications_donor_id", table_name="sms_notifications")
    op.drop_index(
        "ix_sms_notifications_urgency_request_id",
        table_name="sms_notifications",
    )
    op.drop_table("sms_notifications")
