import asyncio
from app.db.connection import async_session
from app.db import queries
from app.schemas.plan import FullPlan

async def get_plan():
    async with async_session() as session:
        plan_doc = await queries.get_current_plan(session, "633576ac-ecf2-40a7-9e95-0caf9bdb1993")
        if plan_doc and plan_doc.get("planData"):
            plan_data = plan_doc["planData"]
            try:
                plan = FullPlan(**plan_data)
                print("Success")
            except Exception as e:
                import traceback
                traceback.print_exc()

asyncio.run(get_plan())
