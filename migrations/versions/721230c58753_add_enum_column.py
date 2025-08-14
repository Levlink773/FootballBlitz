"""add enum column

Revision ID: 721230c58753
Revises: ed0c4f953e54
Create Date: 2025-08-10 19:39:12.792074

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '721230c58753'
down_revision: Union[str, Sequence[str], None] = 'ed0c4f953e54'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Для MySQL: ALTER TABLE + MODIFY COLUMN с новым перечислением
    op.execute("""
        ALTER TABLE users
        MODIFY status_register ENUM(
            'START_REGISTER',
            'CREATE_TEAM',
            'SEND_NAME_TEAM',
            'GET_FIRST_CHARACTER',
            'END_REGISTER',
            'FORGOT_TRAINING'
        ) NOT NULL
    """)


def downgrade() -> None:
    # Откат: убираем GET_FIRST_CHARACTER
    op.execute("""
        ALTER TABLE users
        MODIFY status_register ENUM(
            'START_REGISTER',
            'CREATE_TEAM',
            'SEND_NAME_TEAM',
            'END_REGISTER',
            'FORGOT_TRAINING'
        ) NOT NULL
    """)
