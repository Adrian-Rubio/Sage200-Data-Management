
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
import os
from dotenv import load_dotenv

load_dotenv()
SQLALCHEMY_DATABASE_URL = f"mssql+pyodbc://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_SERVER')}/{os.getenv('DB_DATABASE')}?driver={os.getenv('DB_DRIVER')}&TrustServerCertificate=yes"
engine = create_engine(SQLALCHEMY_DATABASE_URL)

db = Session(bind=engine)
try:
    print(f"db.bind type: {type(db.bind)}")
except AttributeError as e:
    print(f"Error: {e}")

try:
    print(f"db.get_bind() type: {type(db.get_bind())}")
except Exception as e:
    print(f"Error calling get_bind(): {e}")
db.close()
