"""Add work experience and certifications to candidates.

Revision ID: 2f4d8c9a1b7e
Revises: 7bff10e3a09c
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "2f4d8c9a1b7e"
down_revision: Union[str, None] = "7bff10e3a09c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("candidates", sa.Column("work_experience", sa.JSON(), nullable=True))
    op.add_column("candidates", sa.Column("certifications", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("candidates", "certifications")
    op.drop_column("candidates", "work_experience")
