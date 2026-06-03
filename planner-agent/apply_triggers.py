import asyncio
import os
import asyncpg
from dotenv import load_dotenv

# Load from .env
load_dotenv()

async def main():
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        print("Error: DATABASE_URL not found in .env")
        return
        
    # Replace postgresql+asyncpg with postgresql to make it compatible with asyncpg directly
    if db_url.startswith("postgresql+asyncpg://"):
        db_url = db_url.replace("postgresql+asyncpg://", "postgresql://")
        
    conn = await asyncpg.connect(db_url)
    
    # Read the SQL file
    sql_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'prisma', 'sync_triggers.sql')
    with open(sql_path, 'r') as f:
        sql = f.read()
        
    await conn.execute(sql)
    print("Successfully applied PostgreSQL triggers!")
    await conn.close()

if __name__ == "__main__":
    asyncio.run(main())
