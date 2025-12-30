import sqlite3
import os

DB_PATH = "sql_app.db"

def make_admin(email: str):
    if not os.path.exists(DB_PATH):
        print(f"Database NOT found at {DB_PATH}")
        return

    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Check if user exists
        cursor.execute("SELECT id, email, role FROM users WHERE email = ?", (email,))
        user = cursor.fetchone()
        
        if not user:
            print(f"User {email} not found!")
            # List all users
            print("Existing users:")
            for row in cursor.execute("SELECT email, role FROM users"):
                print(f" - {row[0]} ({row[1]})")
            return

        print(f"User found: {user[1]} (ID: {user[0]}). Current role: {user[2]}")
        
        # Update role
        cursor.execute("UPDATE users SET role = 'admin' WHERE email = ?", (email,))
        conn.commit()
        
        # Verify
        cursor.execute("SELECT role FROM users WHERE email = ?", (email,))
        new_role = cursor.fetchone()[0]
        print(f"Success! User {email} is now {new_role}.")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    make_admin("harishgouda52001@gmail.com")
