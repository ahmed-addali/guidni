import asyncio
from app.tools.plan_tools import create_plan_structure
from app.schemas.plan import FullPlan

async def test():
    plan_data = {
      "days": [
        {
          "day_number": 1,
          "slots": [
            {
              "time": "09:00",
              "end_time": "11:00",
              "type": "attraction",
              "title": "Djerba Heritage Village",
              "description": "desc",
              "activity_id": "baa77737-0045-4408-ae7c-99cccab5bf1c"
            }
          ]
        }
      ],
      "stay_suggestions": []
    }
    plan = FullPlan(**plan_data)
    result = await create_plan_structure(plan)
    print("Result:", result)

asyncio.run(test())
