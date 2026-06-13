"""
One-time migration: adds google_id column to the users table.
Run once: python migrate_google.py
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "study_assistant.db")

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Check if google_id column already exists
cursor.execute("PRAGMA table_info(users)")
columns = [row[1] for row in cursor.fetchall()]

if "google_id" not in columns:
    cursor.execute("ALTER TABLE users ADD COLUMN google_id TEXT")
    conn.commit()
    print("[OK] Added 'google_id' column to users table.")
else:
    print("[INFO] 'google_id' column already exists. No changes made.")

conn.close()
print("Migration complete.")
