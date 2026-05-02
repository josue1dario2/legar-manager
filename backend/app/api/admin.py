from typing import Annotated
from datetime import date, timedelta
import httpx
from fastapi import APIRouter, Depends, HTTPException, status, Query

from app.core.security import get_admin_user, get_supabase
from app.models.schemas import AdminUserResponse, RegistroResponse, StatsResponse


router = APIRouter()


@router.get("/users", response_model=list[AdminUserResponse])
async def list_users(
    admin_user: Annotated[dict, Depends(get_admin_user)],
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=1000)
) -> list[AdminUserResponse]:
    client = get_supabase()

    response = httpx.get(
        f"{client.url}/rest/v1/profiles?offset={skip}&limit={limit}",
        headers=client.service_headers,
        timeout=30.0
    )

    if response.status_code != 200:
        raise HTTPException(status_code=500, detail="Error fetching users")

    profiles = response.json()

    users = []
    for profile in profiles:
        # Count registros for this user
        regs_response = httpx.get(
            f"{client.url}/rest/v1/registros?user_id=eq.{profile['id']}&select=id",
            headers=client.service_headers,
            timeout=30.0
        )
        total_registros = len(regs_response.json()) if regs_response.status_code == 200 else 0

        users.append(AdminUserResponse(
            id=profile["id"],
            email=profile["email"],
            full_name=profile.get("full_name"),
            role=profile.get("role", "cliente"),
            empresa=profile.get("empresa"),
            created_at=profile.get("created_at"),
            total_registros=total_registros
        ))

    return users


@router.get("/registros", response_model=list[RegistroResponse])
async def list_all_registros(
    admin_user: Annotated[dict, Depends(get_admin_user)],
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=1000),
    user_id: str | None = None,
    search: str | None = None
) -> list[RegistroResponse]:
    client = get_supabase()

    params = {
        "activo": "eq.true",
        "order": "created_at.desc",
        "offset": str(skip),
        "limit": str(limit)
    }

    if user_id:
        params["user_id"] = f"eq.{user_id}"

    if search:
        search_lower = search.lower()
        params["or"] = f"(actor.ilike.*{search_lower}*,expediente.ilike.*{search_lower}*,nsiniestro.ilike.*{search_lower}*)"

    response = httpx.get(
        f"{client.url}/rest/v1/registros",
        params=params,
        headers=client.service_headers,
        timeout=30.0
    )

    if response.status_code != 200:
        raise HTTPException(status_code=500, detail="Error fetching registros")

    return [RegistroResponse(**r) for r in response.json()]


@router.get("/stats", response_model=StatsResponse)
async def get_global_stats(admin_user: Annotated[dict, Depends(get_admin_user)]) -> StatsResponse:
    client = get_supabase()

    response = httpx.get(
        f"{client.url}/rest/v1/registros",
        headers=client.service_headers,
        timeout=30.0
    )

    if response.status_code != 200:
        raise HTTPException(status_code=500, detail="Error fetching stats")

    registros = response.json()
    total = len(registros)

    hoy = date.today()
    vencen_pronto = sum(
        1 for r in registros
        if r.get("vencimiento") and
        date.fromisoformat(r["vencimiento"]) <= hoy + timedelta(days=3) and
        date.fromisoformat(r["vencimiento"]) >= hoy
    )

    pendientes = sum(1 for r in registros if r.get("estado") == "PENDIENTE")
    despachados = sum(1 for r in registros if r.get("fechaDespacho"))

    return StatsResponse(
        total=total,
        vencen_pronto=vencen_pronto,
        pendientes=pendientes,
        despachados=despachados
    )


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    admin_user: Annotated[dict, Depends(get_admin_user)],
    user_id: str
):
    if user_id == admin_user["user_id"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes eliminarte a ti mismo"
        )

    client = get_supabase()

    # Delete user profile
    httpx.delete(
        f"{client.url}/rest/v1/profiles?id=eq.{user_id}",
        headers=client.service_headers,
        timeout=30.0
    )