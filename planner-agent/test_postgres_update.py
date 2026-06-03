import asyncio
import os
import asyncpg
from dotenv import load_dotenv

load_dotenv()

async def main():
    db_url = os.environ.get("DATABASE_URL")
    if db_url.startswith("postgresql+asyncpg://"):
        db_url = db_url.replace("postgresql+asyncpg://", "postgresql://")
        
    conn = await asyncpg.connect(db_url)
    
    # Let's find any Activity
    activity_id = await conn.fetchval('SELECT id FROM "Activity" LIMIT 1')
    if not activity_id:
        print("No activities found to update.")
        await conn.close()
        return

    print(f"Updating Activity ID: {activity_id}...")
    
    # Perform a dummy update
    await conn.execute('UPDATE "Activity" SET price = price + 1 WHERE id = $1', activity_id)
    print("Update executed! Waiting 5 seconds to let the background listener catch it...")
    
    await asyncio.sleep(5)
    
    print("Test complete. Check agent.log for 'PG NOTIFY received' and 'Upserted activity/... into Qdrant'")
    await conn.close()

if __name__ == "__main__":
    asyncio.run(main())
