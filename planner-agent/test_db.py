import asyncio
from app.db.connection import async_session
from app.db.models import Destination
from sqlalchemy import select

async def test():
    destination = "Djerba"
    async with async_session() as session:
        result = await session.execute(
            select(Destination).where(Destination.city.ilike(f"%{destination}%"))
        )
        dest = result.scalars().first()
        print(f"City match: {dest.id if dest else None}")
        
        result = await session.execute(
            select(Destination).where(Destination.region.ilike(f"%{destination}%"))
        )
        dest = result.scalars().first()
        print(f"Region match: {dest.id if dest else None}")

asyncio.run(test())
