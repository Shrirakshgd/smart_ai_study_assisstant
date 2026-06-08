import sqlite3
from services import load_note_context

conn = sqlite3.connect('study_assistant.db')
cursor = conn.cursor()
cursor.execute("SELECT content FROM notes WHERE id = 1")
row = cursor.fetchone()
conn.close()

if row:
    print(f"Loading note of length {len(row[0])}")
    try:
        load_note_context(row[0])
        print("Success")
    except Exception as e:
        import traceback
        traceback.print_exc()
else:
    print("No note found")
