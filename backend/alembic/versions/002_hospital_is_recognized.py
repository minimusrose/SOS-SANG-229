"""Add hospitals.is_recognized and enforce it on urgencies.

Revision ID: 002_hospital_recognized
Revises: 001_mvp_schema
Create Date: 2026-09-09
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "002_hospital_recognized"
down_revision: Union[str, Sequence[str], None] = "001_mvp_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "hospitals",
        sa.Column(
            "is_recognized",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
            comment=(
                "State-recognized facility. Default false. "
                "Urgency requests may only target recognized hospitals."
            ),
        ),
    )
    op.create_index("ix_hospitals_is_recognized", "hospitals", ["is_recognized"])

    op.execute(
        """
        CREATE OR REPLACE FUNCTION enforce_urgency_recognized_hospital()
        RETURNS trigger
        LANGUAGE plpgsql
        AS $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM hospitals AS h
                WHERE h.id = NEW.hospital_id
                  AND h.is_recognized IS TRUE
            ) THEN
                RAISE EXCEPTION
                    'urgency_requests may only target a hospital with is_recognized = true';
            END IF;
            RETURN NEW;
        END;
        $$;
        """
    )
    op.execute("DROP TRIGGER IF EXISTS trg_urgency_recognized_hospital ON urgency_requests")
    op.execute(
        """
        CREATE TRIGGER trg_urgency_recognized_hospital
        BEFORE INSERT OR UPDATE OF hospital_id ON urgency_requests
        FOR EACH ROW
        EXECUTE FUNCTION enforce_urgency_recognized_hospital();
        """
    )


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS trg_urgency_recognized_hospital ON urgency_requests")
    op.execute("DROP FUNCTION IF EXISTS enforce_urgency_recognized_hospital()")
    op.drop_index("ix_hospitals_is_recognized", table_name="hospitals")
    op.drop_column("hospitals", "is_recognized")
