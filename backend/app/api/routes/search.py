import uuid
from typing import Any

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import text

from app.api.deps import DBDep, TenantDep

router = APIRouter(prefix="/search", tags=["search"])


class SearchRequest(BaseModel):
    query: str
    doc_id: uuid.UUID
    top_k: int = 10
    layer: str = "leaf"  # leaf | section | document


class SearchResult(BaseModel):
    chunk_id: uuid.UUID
    content: str
    page_num: int | None
    bbox: dict[str, Any] | None
    score: float
    layer: str


class SearchResponse(BaseModel):
    results: list[SearchResult]
    query: str
    doc_id: uuid.UUID


def _embed_query(query: str) -> list[float]:
    from sentence_transformers import SentenceTransformer
    model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    return model.encode(query, normalize_embeddings=True).tolist()


@router.post("", response_model=SearchResponse)
async def search(body: SearchRequest, db: DBDep, tenant_id: TenantDep):
    if not body.query.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty query")

    query_embedding = _embed_query(body.query)
    embedding_str = "[" + ",".join(str(v) for v in query_embedding) + "]"

    # BM25 via pg_trgm similarity (fast, no extra index needed)
    bm25_sql = text("""
        SELECT id, content, page_num, bbox, chunk_metadata,
               similarity(content, :query) AS bm25_score,
               ROW_NUMBER() OVER (ORDER BY similarity(content, :query) DESC) AS bm25_rank
        FROM document_chunks
        WHERE doc_id = :doc_id
          AND tenant_id = :tenant_id
          AND (:layer = 'all' OR chunk_metadata->>'layer' = :layer)
        ORDER BY bm25_score DESC
        LIMIT 20
    """)

    # Dense cosine similarity via pgvector
    dense_sql = text(f"""
        SELECT id, content, page_num, bbox, chunk_metadata,
               1 - (embedding <=> '{embedding_str}'::vector) AS dense_score,
               ROW_NUMBER() OVER (ORDER BY embedding <=> '{embedding_str}'::vector) AS dense_rank
        FROM document_chunks
        WHERE doc_id = :doc_id
          AND tenant_id = :tenant_id
          AND embedding IS NOT NULL
          AND (:layer = 'all' OR chunk_metadata->>'layer' = :layer)
        ORDER BY dense_score DESC
        LIMIT 20
    """)

    params = {
        "query": body.query,
        "doc_id": str(body.doc_id),
        "tenant_id": str(tenant_id),
        "layer": body.layer,
    }

    bm25_rows = (await db.execute(bm25_sql, params)).fetchall()
    dense_rows = (await db.execute(dense_sql, params)).fetchall()

    # RRF fusion: score = 1/(k + rank), k=60
    k = 60
    rrf: dict[str, dict] = {}

    for row in bm25_rows:
        rid = str(row.id)
        rrf.setdefault(rid, {"row": row, "score": 0.0})
        rrf[rid]["score"] += 1 / (k + row.bm25_rank)

    for i, row in enumerate(dense_rows, 1):
        rid = str(row.id)
        rrf.setdefault(rid, {"row": row, "score": 0.0})
        rrf[rid]["score"] += 1 / (k + i)

    ranked = sorted(rrf.values(), key=lambda x: x["score"], reverse=True)[: body.top_k]

    results = [
        SearchResult(
            chunk_id=item["row"].id,
            content=item["row"].content,
            page_num=item["row"].page_num,
            bbox=item["row"].bbox,
            score=round(item["score"], 6),
            layer=item["row"].chunk_metadata.get("layer", "leaf") if item["row"].chunk_metadata else "leaf",
        )
        for item in ranked
    ]

    return SearchResponse(results=results, query=body.query, doc_id=body.doc_id)