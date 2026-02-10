"""seed initial users with hashed passwords

Revision ID: 20260203_seed_users
Revises: a7b8c9d0e1f2
Create Date: 2026-02-03 14:00:00.000000

"""
from typing import Sequence, Union
import uuid
from alembic import op
import sqlalchemy as sa

# Import password hashing from app
from app.core.security import get_password_hash


# revision identifiers, used by Alembic.
revision: str = '20260203_seed_users'
down_revision: Union[str, None] = 'a7b8c9d0e1f2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# Default users with plain passwords (will be hashed during migration)
DEFAULT_USERS = [
    {
        'username': 'admin',
        'email': 'admin@example.com',
        'full_name': 'System Administrator',
        'role': 'ADMIN',
        'password': 'admin123'
    },
    {
        'username': 'dr_sharma',
        'email': 'dr.sharma@example.com',
        'full_name': 'Dr. Rajesh Sharma',
        'role': 'DOCTOR',
        'password': 'doctor123'
    },
    {
        'username': 'nurse_priya',
        'email': 'nurse.priya@example.com',
        'full_name': 'Priya Singh',
        'role': 'NURSE',
        'password': 'nurse123'
    },
    {
        'username': 'reception',
        'email': 'reception@example.com',
        'full_name': 'Reception Desk',
        'role': 'RECEPTIONIST',
        'password': 'reception123'
    }
]


def upgrade() -> None:
    """Seed initial users if they don't exist, or update passwords if they do"""
    
    # Get connection
    conn = op.get_bind()
    
    for user in DEFAULT_USERS:
        # Generate password hash using app's security module
        password_hash = get_password_hash(user['password'])
        user_id = str(uuid.uuid4())
        
        # Check if user exists
        result = conn.execute(
            sa.text("SELECT id FROM users WHERE username = :username"),
            {"username": user['username']}
        )
        existing = result.fetchone()
        
        if not existing:
            # Insert new user
            conn.execute(
                sa.text("""
                    INSERT INTO users (id, username, email, password_hash, full_name, role, is_active, is_deleted)
                    VALUES (:id, :username, :email, :password_hash, :full_name, :role, true, false)
                """),
                {
                    'id': user_id,
                    'username': user['username'],
                    'email': user['email'],
                    'password_hash': password_hash,
                    'full_name': user['full_name'],
                    'role': user['role']
                }
            )
            print(f"  ✅ Created user: {user['username']} (password: {user['password']})")
        else:
            # Update existing user's password
            conn.execute(
                sa.text("UPDATE users SET password_hash = :password_hash WHERE username = :username"),
                {"password_hash": password_hash, "username": user['username']}
            )
            print(f"  ✅ Updated password for: {user['username']} (password: {user['password']})")


def downgrade() -> None:
    """Remove seeded users"""
    conn = op.get_bind()
    
    for user in DEFAULT_USERS:
        conn.execute(
            sa.text("DELETE FROM users WHERE username = :username"),
            {"username": user['username']}
        )
