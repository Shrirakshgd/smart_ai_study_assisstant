import sqlite3

conn = sqlite3.connect('study_assistant.db')
cursor = conn.cursor()
cursor.execute("SELECT id, title, length(content), content FROM notes WHERE id = 1")
row = cursor.fetchone()
if row:
    print(f"ID: {row[0]}, Title: {row[1]}, Content Length: {row[2]}, Content: {repr(row[3][:100])}")
else:
    print("No note found with ID 1")
conn.close()
