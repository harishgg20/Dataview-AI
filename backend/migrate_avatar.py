import sqlite3

def migrate():
    try:
        conn = sqlite3.connect('sql_app.db')
        cursor = conn.cursor()
        
        # Check if column exists
        cursor.execute("PRAGMA table_info(users)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if 'avatar_data' not in columns:
            print("Adding avatar_data column...")
            cursor.execute("ALTER TABLE users ADD COLUMN avatar_data TEXT")
            conn.commit()
            print("Migration successful.")
        else:
            print("Column avatar_data already exists.")
            
        conn.close()
    except Exception as e:
        print(f"Migration failed: {e}")

if __name__ == "__main__":
    migrate()
