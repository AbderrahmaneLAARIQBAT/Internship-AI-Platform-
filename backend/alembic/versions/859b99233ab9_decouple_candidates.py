"""decouple_candidates

Revision ID: 859b99233ab9
Revises: 7354a1ccbcfd
Create Date: 2026-07-28 18:14:15.763494

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '859b99233ab9'
down_revision: Union[str, None] = '7354a1ccbcfd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add columns as nullable first
    op.add_column('candidates', sa.Column('first_name', sa.String(length=100), nullable=True))
    op.add_column('candidates', sa.Column('last_name', sa.String(length=100), nullable=True))
    op.add_column('candidates', sa.Column('email', sa.String(length=255), nullable=True))

    # Copy data from users to candidates
    op.execute("""
        UPDATE candidates
        SET first_name = split_part(users.full_name, ' ', 1),
            last_name = CASE 
                            WHEN position(' ' in users.full_name) > 0 
                            THEN substring(users.full_name from position(' ' in users.full_name) + 1)
                            ELSE ''
                        END,
            email = users.email
        FROM users
        WHERE candidates.user_id = users.id
    """)
    
    op.execute("UPDATE candidates SET first_name='Unknown', last_name='', email=id||'@unknown.com' WHERE first_name IS NULL")

    # Alter columns to NOT NULL
    op.alter_column('candidates', 'first_name', nullable=False)
    op.alter_column('candidates', 'last_name', nullable=False)
    op.alter_column('candidates', 'email', nullable=False)
    op.create_index(op.f('ix_candidates_email'), 'candidates', ['email'], unique=True)
    
    # Drop user_id constraint and column
    op.drop_constraint('candidates_user_id_fkey', 'candidates', type_='foreignkey')
    op.drop_column('candidates', 'user_id')

    # Delete all students from users table
    op.execute("DELETE FROM users WHERE role = 'student'")


def downgrade() -> None:
    op.add_column('candidates', sa.Column('user_id', sa.INTEGER(), autoincrement=False, nullable=True))
    op.create_foreign_key('candidates_user_id_fkey', 'candidates', 'users', ['user_id'], ['id'], ondelete='CASCADE')
    op.create_unique_constraint('candidates_user_id_key', 'candidates', ['user_id'])
    
    op.drop_index(op.f('ix_candidates_email'), table_name='candidates')
    op.drop_column('candidates', 'email')
    op.drop_column('candidates', 'last_name')
    op.drop_column('candidates', 'first_name')
