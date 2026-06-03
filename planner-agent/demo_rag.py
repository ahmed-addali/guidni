import asyncio
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from app.rag.query_engine import qdrant_search_advanced
from app.db.connection import async_session
from app.db.models import Destination, Restaurant
from sqlalchemy import select

async def main():
    console = Console()
    
    # Get a destination ID for Djerba
    dest_id = None
    async with async_session() as session:
        result = await session.execute(
            select(Destination).where(Destination.city.ilike(f"%Djerba%"))
        )
        dest = result.scalars().first()
        if dest:
            dest_id = str(dest.id)
            
    query = "restaurant traditionnel avec des plats de fruits de mer et une belle vue"
    
    console.print(Panel(f"[bold blue]Recherche RAG avec Qdrant[/bold blue]\n[green]Requête:[/green] {query}\n[green]Filtres:[/green] {{'entity_type': 'restaurant', 'destination_id': '{dest_id}'}}", title="Paramètres", expand=False))
    
    with console.status("[bold green]Interrogation de Qdrant..."):
        results = await qdrant_search_advanced(
            query=query,
            entity_type="restaurant",
            filters={},
            top_k=5,
            destination_id=dest_id
        )
        
    table = Table(title="Exemple de résultats d'une recherche RAG avec scores de similarité", show_lines=True)
    table.add_column("Score", justify="right", style="cyan", no_wrap=True)
    table.add_column("Type", style="magenta")
    table.add_column("Nom du lieu", style="green")
    table.add_column("Tags", style="yellow")
    table.add_column("Extrait (Narrative)", style="white")

    async with async_session() as session:
        for r in results:
            # Fetch title from DB
            db_res = await session.execute(select(Restaurant).where(Restaurant.id == r.entity_id))
            db_entity = db_res.scalars().first()
            title = db_entity.name if db_entity else "N/A"
            
            tags_str = ", ".join(r.tags[:3]) if r.tags else "N/A"
            snippet = r.narrative_text[:80] + "..." if len(r.narrative_text) > 80 else r.narrative_text
            score_str = f"{r.score:.4f}"
            table.add_row(
                f"[bold]{score_str}[/bold]", 
                r.entity_type, 
                title, 
                tags_str, 
                snippet
            )

    console.print(table)
    console.print("\n[italic]Note: The search uses hybrid fusion (RRF) and BGE-Reranker for high-precision scoring.[/italic]")

if __name__ == "__main__":
    asyncio.run(main())
