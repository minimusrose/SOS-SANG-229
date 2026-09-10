"""Accounts (users) + request / donor ownership.

Revision ID: 005_users_and_ownership
Revises: 004_sms_notifications
Create Date: 2026-09-10
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "005_users_and_ownership"
down_revision: Union[str, Sequence[str], None] = "004_sms_notifications"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column(
            "id",
            sa.Uuid(),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("phone", sa.String(length=20), nullable=False),
        sa.Column("display_name", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
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
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("phone", name="uq_users_phone"),
        comment="Accounts. phone and password_hash are SENSITIVE.",
    )
    op.create_index("ix_users_phone", "users", ["phone"])

    op.add_column("donors", sa.Column("user_id", sa.Uuid(), nullable=True))
    op.create_foreign_key(
        "fk_donors_user_id",
        "donors",
        "users",
        ["user_id"],
        ["id"],
        ondelete="RESTRICT",
    )
    op.create_unique_constraint("uq_donors_user_id", "donors", ["user_id"])

    op.add_column(
        "urgency_requests",
        sa.Column("requester_user_id", sa.Uuid(), nullable=True),
    )
    op.create_foreign_key(
        "fk_urgency_requests_requester_user_id",
        "urgency_requests",
        "users",
        ["requester_user_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(
        "ix_urgency_requests_requester_user_id",
        "urgency_requests",
        ["requester_user_id"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_urgency_requests_requester_user_id",
        table_name="urgency_requests",
    )
    op.drop_constraint(
        "fk_urgency_requests_requester_user_id",
        "urgency_requests",
        type_="foreignkey",
    )
    op.drop_column("urgency_requests", "requester_user_id")

    op.drop_constraint("uq_donors_user_id", "donors", type_="unique")
    op.drop_constraint("fk_donors_user_id", "donors", type_="foreignkey")
    op.drop_column("donors", "user_id")

    op.drop_index("ix_users_phone", table_name="users")
    op.drop_table("users")
