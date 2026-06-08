import sqlite3

def fix_db():
    try:
        conn = sqlite3.connect('study_assistant.db')
        cursor = conn.cursor()
        
        # Check if is_bookmarked exists in notes
        cursor.execute("PRAGMA table_info(notes)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if 'is_bookmarked' not in columns:
            print("Adding is_bookmarked column to notes table...")
            cursor.execute("ALTER TABLE notes ADD COLUMN is_bookmarked INTEGER DEFAULT 0")
            conn.commit()
            print("Successfully added is_bookmarked column.")
        else:
            print("Column is_bookmarked already exists.")
            
        conn.close()
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    fix_db()
