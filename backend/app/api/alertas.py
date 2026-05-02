from typing import Annotated
import httpx
from fastapi import APIRouter, Depends, HTTPException, status, Query

from app.core.security import get_current_user, get_supabase
from app.models.schemas import AlertaResponse


router = APIRouter()


@router.get("/", response_model=list[AlertaResponse])
async def list_alertas(
    current_user: Annotated[dict, Depends(get_current_user)],
    unread_only: bool = Query(default=False)
) -> list[AlertaResponse]:
    client = get_supabase()
    user_id = current_user["user_id"]

    url = f"{client.url}/rest/v1/alertas"
    params = [f"user_id=eq.{user_id}"]

    if unread_only:
        params.append("leida=eq.false")

    params.append("order=created_at.desc")

    response = httpx.get(
        f"{url}?{'&'.join(params)}",
        headers=client.service_headers,
        timeout=30.0
    )

    if response.status_code != 200:
        raise HTTPException(status_code=500, detail="Error fetching alertas")

    return [AlertaResponse(**a) for a in response.json()]


@router.put("/{alerta_id}/read", response_model=AlertaResponse)
async def mark_as_read(
    current_user: Annotated[dict, Depends(get_current_user)],
    alerta_id: str
) -> AlertaResponse:
    client = get_supabase()

    # Verify ownership
    response = httpx.get(
        f"{client.url}/rest/v1/alertas?id=eq.{alerta_id}",
        headers=client.service_headers,
        timeout=30.0
    )

    if response.status_code != 200:
        raise HTTPException(status_code=500, detail="Error fetching alerta")

    data = response.json()
    if not data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alerta no encontrada")

    alerta = data[0]

    if alerta["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes acceso")

    # Mark as read
    response = httpx.patch(
        f"{client.url}/rest/v1/alertas?id=eq.{alerta_id}",
        headers=client.service_headers,
        json={"leida": True},
        timeout=30.0
    )

    if response.status_code != 200:
        raise HTTPException(status_code=500, detail="Error marking alerta as read")

    return AlertaResponse(**response.json()[0])


@router.put("/read-all")
async def mark_all_as_read(current_user: Annotated[dict, Depends(get_current_user)]):
    client = get_supabase()
    user_id = current_user["user_id"]

    httpx.patch(
        f"{client.url}/rest/v1/alertas?user_id=eq.{user_id}&leida=eq.false",
        headers=client.service_headers,
        json={"leida": True},
        timeout=30.0
    )

    return {"success": True, "message": "Todas las alertas marcadas como leídas"}