from __future__ import annotations
from typing import List

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select

# Adjust imports to match your project layout
from database.session import get_session
from database.models.statistics import Statistics
from stats.stat_enum import StatisticsType
from logging_config import logger

router = APIRouter(prefix="/statistics", tags=["statistics"])


class SaveStatisticsRequest(BaseModel):
    user_id: int
    stat_type: StatisticsType


def stat_to_dict(s: Statistics) -> dict:
    return {
        "id": getattr(s, "id", None),
        "user_id": getattr(s, "user_id", None),
        "stat_type": getattr(s, "stat_type").name if getattr(s, "stat_type", None) is not None else None,
    }


@router.post("/", status_code=status.HTTP_201_CREATED)
async def save_statistics(req: SaveStatisticsRequest):
    """Сохраняет статистику для пользователя (если ещё не сохранена)."""
    try:
        # импорт сервиса локально, путь поправьте если нужно
        from services.statistics_service import StatisticsService
        await StatisticsService.save_statistics(user_id=req.user_id, stat_type=req.stat_type)
        return {"ok": True, "user_id": req.user_id, "stat_type": req.stat_type.name}
    except Exception as e:
        logger.exception("save_statistics failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/user/{user_id}", response_model=List[dict])
async def get_stats_by_user(user_id: int):
    """Возвращает список записей статистики для конкретного пользователя."""
    try:
        async for session in get_session():
            async with session.begin():
                result = await session.execute(
                    select(Statistics).where(Statistics.user_id == user_id)
                )
                rows = result.scalars().all()
                return [stat_to_dict(r) for r in rows]
    except Exception as e:
        logger.exception("get_stats_by_user failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=List[dict])
async def get_all_stats():
    """Возвращает все записи статистики."""
    try:
        async for session in get_session():
            async with session.begin():
                result = await session.execute(select(Statistics))
                rows = result.scalars().all()
                return [stat_to_dict(r) for r in rows]
    except Exception as e:
        logger.exception("get_all_stats failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
