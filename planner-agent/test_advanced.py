import asyncio
from app.rag.query_engine import qdrant_search_advanced

async def run_test():
    filters = {
        "must": [
            {"key": "price", "lte": 5000}
        ]
    }
    
    results = await qdrant_search_advanced(
        query="restaurant",
        entity_type="restaurant",
        filters=filters,
        top_k=2
    )
    
    print(f"Results found: {len(results)}")
    for r in results:
        print(f"- {r.title} (Score: {r.score}) - Price: {r.price}")

if __name__ == "__main__":
    asyncio.run(run_test())
