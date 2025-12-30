import sqlite3

def migrate():
    try:
        conn = sqlite3.connect('sql_app.db')
        cursor = conn.cursor()
        
        # Check table info
        cursor.execute("PRAGMA table_info(users)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if 'phone_number' not in columns:
            print("Adding phone_number column...")
            cursor.execute("ALTER TABLE users ADD COLUMN phone_number VARCHAR")
        else:
            print("Column phone_number already exists.")

        if 'job_title' not in columns:
            print("Adding job_title column...")
            cursor.execute("ALTER TABLE users ADD COLUMN job_title VARCHAR")
        else:
            print("Column job_title already exists.")
            
        conn.commit()
        conn.close()
        print("Migration successful.")
    except Exception as e:
        print(f"Migration failed: {e}")

if __name__ == "__main__":
    migrate()
