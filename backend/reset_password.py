#!/usr/bin/env python3
"""
Reset admin password for EHR system
"""
import sys
from sqlalchemy import create_engine, text
from passlib.context import CryptContext

# Password hasher
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Database URL
DATABASE_URL = "postgresql://ehr_user:ehr_password@localhost:5433/ehr_db"

def hash_password(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)

def reset_admin_password(new_password: str = "admin123"):
    """Reset admin user password"""
    engine = create_engine(DATABASE_URL)
    
    try:
        with engine.connect() as conn:
            # Hash the new password
            hashed_password = hash_password(new_password)
            
            # Update admin password
            result = conn.execute(
                text("UPDATE users SET password_hash = :password WHERE username = 'admin'"),
                {"password": hashed_password}
            )
            conn.commit()
            
            if result.rowcount > 0:
                print(f"✅ Admin password reset successfully!")
                print(f"   Username: admin")
                print(f"   Password: {new_password}")
            else:
                print("❌ Admin user not found in database")
                return False
                
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    finally:
        engine.dispose()
    
    return True

if __name__ == "__main__":
    new_pwd = sys.argv[1] if len(sys.argv) > 1 else "admin123"
    reset_admin_password(new_pwd)
