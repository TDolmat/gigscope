#!/usr/bin/env python3
"""
Script to create admin users for AI Scoper.

Usage:
    python create_admin.py                      # Interactive mode
    python create_admin.py email password       # Direct mode
    python create_admin.py --list               # List all admins
"""

import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

import bcrypt
from app import create_app
from core.models import db, Admins


def hash_password(password: str) -> str:
    """Hash password using bcrypt."""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def create_admin(email: str, password: str) -> bool:
    """Create a new admin user."""
    # Check if admin already exists
    existing = Admins.query.filter_by(email=email).first()
    if existing:
        print(f"❌ Admin with email '{email}' already exists!")
        return False
    
    # Create new admin
    admin = Admins(
        email=email,
        password=hash_password(password)
    )
    
    db.session.add(admin)
    db.session.commit()
    
    print(f"✅ Admin created successfully!")
    print(f"   Email: {email}")
    print(f"   ID: {admin.id}")
    return True


def list_admins():
    """List all admin users."""
    admins = Admins.query.all()
    
    if not admins:
        print("No admins found.")
        return
    
    print(f"\n{'ID':<5} {'Email':<40} {'Created At'}")
    print("-" * 70)
    for admin in admins:
        print(f"{admin.id:<5} {admin.email:<40} {admin.created_at}")


def interactive_mode():
    """Interactive mode for creating admin."""
    print("\n=== AI Scoper Admin Creator ===\n")
    
    email = input("Enter admin email: ").strip()
    if not email:
        print("❌ Email cannot be empty!")
        return
    
    password = input("Enter password: ").strip()
    if not password:
        print("❌ Password cannot be empty!")
        return
    
    if len(password) < 6:
        print("❌ Password must be at least 6 characters!")
        return
    
    confirm = input(f"\nCreate admin with email '{email}'? [y/N]: ").strip().lower()
    if confirm != 'y':
        print("Cancelled.")
        return
    
    create_admin(email, password)


def main():
    app = create_app()
    
    with app.app_context():
        if len(sys.argv) == 1:
            # Interactive mode
            interactive_mode()
        elif sys.argv[1] == '--list':
            # List admins
            list_admins()
        elif len(sys.argv) == 3:
            # Direct mode: email password
            email = sys.argv[1]
            password = sys.argv[2]
            create_admin(email, password)
        else:
            print(__doc__)
            sys.exit(1)


if __name__ == '__main__':
    main()

