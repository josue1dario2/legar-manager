from datetime import date, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status, Query
import httpx

from app.core.security import get_current_user, get_supabase
from app.models.schemas import RegistroCreate, RegistroUpdate, RegistroResponse, StatsResponse


router = APIRouter()


def serialize_value(v):
    """Convert date objects to ISO string for JSON serialization"""
    if isinstance(v, date):
        return v.isoformat()
    return v


@router.get("/", response_model=list[RegistroResponse])
async def list_registros(
    current_user: Annotated[dict, Depends(get_current_user)],
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=1000),
    search: str | None = None,
    estado: str | None = None
) -> list[RegistroResponse]:
    client = get_supabase()
    user_id = current_user["user_id"]

    url = f"{client.url}/rest/v1/registros"
    params = {
        "user_id": f"eq.{user_id}",
        "activo": "eq.true",
        "order": "created_at.desc",
        "offset": str(skip),
        "limit": str(limit)
    }

    if search:
        search_lower = search.lower()
        params["or"] = f"(actor.ilike.*{search_lower}*,expediente.ilike.*{search_lower}*,nsiniestro.ilike.*{search_lower}*)"
    if estado:
        params["estado"] = f"eq.{estado}"

    response = httpx.get(
        f"{url}",
        params=params,
        headers=client.service_headers,
        timeout=30.0
    )

    print(f"[DEBUG] search={search}, params={params}")
    print(f"[DEBUG] URL built: {response.url}")

    if response.status_code != 200:
        raise HTTPException(status_code=500, detail="Error fetching registros")

    return [RegistroResponse(**r) for r in response.json()]


@router.post("/", response_model=RegistroResponse, status_code=status.HTTP_201_CREATED)
async def create_registro(
    current_user: Annotated[dict, Depends(get_current_user)],
    registro: RegistroCreate
) -> RegistroResponse:
    client = get_supabase()

    registro_dict = registro.model_dump()

    # Only include fields with values
    clean_data = {}
    for key, value in registro_dict.items():
        if value is not None:
            if isinstance(value, date):
                clean_data[key] = value.isoformat()
            else:
                clean_data[key] = value

    clean_data["user_id"] = current_user["user_id"]

    response = httpx.post(
        f"{client.url}/rest/v1/registros",
        headers=client.service_headers,
        json=clean_data,
        timeout=30.0
    )

    if response.status_code not in (0, 200, 201):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error creating registro: {response.text}"
        )

    # Supabase returns the created object in the response
    resp_data = response.json()
    if isinstance(resp_data, list):
        resp_data = resp_data[0] if resp_data else {}

    return RegistroResponse(**resp_data)


@router.get("/stats", response_model=StatsResponse)
async def get_stats(current_user: Annotated[dict, Depends(get_current_user)]) -> StatsResponse:
    client = get_supabase()
    user_id = current_user["user_id"]

    response = httpx.get(
        f"{client.url}/rest/v1/registros?user_id=eq.{user_id}",
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


@router.get("/{registro_id}", response_model=RegistroResponse)
async def get_registro(
    current_user: Annotated[dict, Depends(get_current_user)],
    registro_id: str
) -> RegistroResponse:
    client = get_supabase()

    response = httpx.get(
        f"{client.url}/rest/v1/registros?id=eq.{registro_id}",
        headers=client.service_headers,
        timeout=30.0
    )

    if response.status_code != 200:
        raise HTTPException(status_code=500, detail="Error fetching registro")

    data = response.json()
    if not data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registro no encontrado")

    registro = data[0]

    if registro["user_id"] != current_user["user_id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes acceso")

    return RegistroResponse(**registro)


@router.put("/{registro_id}", response_model=RegistroResponse)
async def update_registro(
    current_user: Annotated[dict, Depends(get_current_user)],
    registro_id: str,
    updates: RegistroUpdate
) -> RegistroResponse:
    client = get_supabase()

    # Check ownership
    response = httpx.get(
        f"{client.url}/rest/v1/registros?id=eq.{registro_id}",
        headers=client.service_headers,
        timeout=30.0
    )

    if response.status_code != 200:
        raise HTTPException(status_code=500, detail="Error fetching registro")

    data = response.json()
    if not data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registro no encontrado")

    registro = data[0]

    if registro["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes acceso")

    update_dict = {k: v for k, v in updates.model_dump().items() if v is not None}

    # Convert date objects to strings
    for key, value in update_dict.items():
        if isinstance(value, date):
            update_dict[key] = value.isoformat()

    update_dict["updated_at"] = "now()"

    response = httpx.patch(
        f"{client.url}/rest/v1/registros?id=eq.{registro_id}",
        headers=client.service_headers,
        json=update_dict,
        timeout=30.0
    )

    if response.status_code != 200:
        raise HTTPException(status_code=500, detail="Error updating registro")

    return RegistroResponse(**response.json()[0])


@router.delete("/{registro_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_registro(
    current_user: Annotated[dict, Depends(get_current_user)],
    registro_id: str
):
    client = get_supabase()

    response = httpx.get(
        f"{client.url}/rest/v1/registros?id=eq.{registro_id}",
        headers=client.service_headers,
        timeout=30.0
    )

    if response.status_code != 200:
        raise HTTPException(status_code=500, detail="Error fetching registro")

    data = response.json()
    if not data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registro no encontrado")

    registro = data[0]

    if registro["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes acceso")

    httpx.patch(
        f"{client.url}/rest/v1/registros?id=eq.{registro_id}",
        headers=client.service_headers,
        json={"activo": False},
        timeout=30.0
    )