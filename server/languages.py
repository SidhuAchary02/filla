from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import text
from database import engine
from typing import List, Optional

router = APIRouter(prefix="/api", tags=["languages"])


def normalize_language(value: str) -> str:
    return "_".join(value.strip().lower().split())


class LanguageItem(BaseModel):
    name: str
    normalized: str


class LanguageCreateRequest(BaseModel):
    name: str = Field(..., min_length=1)
    normalized: Optional[str] = None


def _row_to_language(row) -> LanguageItem:
    mapping = row._mapping if hasattr(row, "_mapping") else row
    return LanguageItem(name=mapping["name"], normalized=mapping["normalized"])


@router.get("/languages", response_model=List[LanguageItem])
def get_languages(search: str = Query(default="", description="Search by language name")):
    normalized_search = normalize_language(search) if search.strip() else ""
    name_search = f"%{search.strip().lower()}%"
    normalized_like = f"%{normalized_search}%" if normalized_search else name_search

    query = text(
        """
        SELECT name, normalized
        FROM languages
        WHERE (:search = '' OR lower(name) LIKE :name_search OR normalized LIKE :normalized_like)
        ORDER BY name ASC
        LIMIT 50
        """
    )

    with engine.connect() as connection:
        rows = connection.execute(
            query,
            {
                "search": search.strip(),
                "name_search": name_search,
                "normalized_like": normalized_like,
            },
        ).fetchall()

    return [_row_to_language(row) for row in rows]


@router.post("/languages", response_model=LanguageItem, status_code=status.HTTP_201_CREATED)
def create_language(payload: LanguageCreateRequest):
    name = payload.name.strip()
    normalized = normalize_language(payload.normalized or name)

    if not name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Language name is required")

    select_query = text(
        """
        SELECT name, normalized
        FROM languages
        WHERE normalized = :normalized
        LIMIT 1
        """
    )

    insert_query = text(
        """
        INSERT INTO languages (name, normalized)
        VALUES (:name, :normalized)
        ON CONFLICT (normalized) DO NOTHING
        RETURNING name, normalized
        """
    )

    with engine.begin() as connection:
        existing = connection.execute(select_query, {"normalized": normalized}).fetchone()
        if existing:
            return _row_to_language(existing)

        created = connection.execute(insert_query, {"name": name, "normalized": normalized}).fetchone()
        if created:
            return _row_to_language(created)

        existing = connection.execute(select_query, {"normalized": normalized}).fetchone()
        if existing:
            return _row_to_language(existing)

    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create language")
