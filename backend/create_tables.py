from app.core.database import engine, Base
from app.models import Dashboard, Widget, User, Project, DataSource

def create_tables():
    print("Creating all tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully.")

if __name__ == "__main__":
    create_tables()
