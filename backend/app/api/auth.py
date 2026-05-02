from typing import Annotated
import httpx
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import create_access_token, get_current_user, supabase_auth, get_supabase, verify_supabase_token
from app.models.schemas import UserCreate, UserLogin, UserResponse, TokenResponse


router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate) -> TokenResponse:
    try:
        # Create user via admin API
        auth_response = supabase_auth.admin_create_user(
            email=user_data.email,
            password=user_data.password,
            metadata={
                "full_name": user_data.full_name or "",
                "empresa": user_data.empresa or "",
            }
        )

        if "id" not in auth_response:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se pudo crear el usuario"
            )

        user_id = auth_response["id"]

        # Create profile via REST API
        client = get_supabase()
        profile_data = {
            "id": user_id,
            "email": user_data.email,
            "full_name": user_data.full_name or "",
            "empresa": user_data.empresa or "",
            "role": "cliente"
        }

        httpx.post(
            f"{client.url}/rest/v1/profiles",
            headers=client.service_headers,
            json=profile_data,
            timeout=30.0
        )

        token = create_access_token({
            "sub": user_id,
            "email": user_data.email,
            "role": "cliente"
        })

        return TokenResponse(
            access_token=token,
            user=UserResponse(
                id=user_id,
                email=user_data.email,
                full_name=user_data.full_name,
                role="cliente",
                empresa=user_data.empresa
            )
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin) -> TokenResponse:
    try:
        auth_response = supabase_auth.sign_in_with_password(
            email=credentials.email,
            password=credentials.password
        )

        if "access_token" not in auth_response:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciales inválidas"
            )

        user_id = auth_response["user"]["id"]

        # Get profile via REST API
        client = get_supabase()
        response = httpx.get(
            f"{client.url}/rest/v1/profiles?id=eq.{user_id}",
            headers=client.service_headers,
            timeout=30.0
        )

        profile_data = response.json()
        profile = profile_data[0] if profile_data else None

        if not profile:
            # Profile doesn't exist, create it
            profile = {
                "id": user_id,
                "email": credentials.email,
                "role": "cliente"
            }
            httpx.post(
                f"{client.url}/rest/v1/profiles",
                headers=client.service_headers,
                json=profile,
                timeout=30.0
            )
            role = "cliente"
        else:
            role = profile.get("role", "cliente")

        token = create_access_token({
            "sub": user_id,
            "email": credentials.email,
            "role": role
        })

        return TokenResponse(
            access_token=token,
            user=UserResponse(
                id=user_id,
                email=credentials.email,
                full_name=profile.get("full_name"),
                role=role,
                empresa=profile.get("empresa"),
                created_at=profile.get("created_at")
            )
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas"
        )


@router.post("/oauth/google", response_model=TokenResponse)
async def oauth_google(token_data: dict) -> TokenResponse:
    """Exchange Supabase OAuth token for our own JWT"""
    access_token = token_data.get("access_token")

    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token requerido"
        )

    user_info = await verify_supabase_token(access_token)
    if not user_info:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido"
        )

    supabase_user_id = user_info.get("id")
    email = user_info.get("email")

    if not supabase_user_id or not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Datos de usuario inválidos"
        )

    client = get_supabase()

    response = httpx.get(
        f"{client.url}/rest/v1/profiles?id=eq.{supabase_user_id}",
        headers=client.service_headers,
        timeout=30.0
    )

    profile_data = response.json()
    profile = profile_data[0] if profile_data else None

    if not profile:
        full_name = user_info.get("full_name", "")
        profile = {
            "id": supabase_user_id,
            "email": email,
            "full_name": full_name,
            "role": "cliente"
        }
        httpx.post(
            f"{client.url}/rest/v1/profiles",
            headers=client.service_headers,
            json=profile,
            timeout=30.0
        )
        role = "cliente"
    else:
        role = profile.get("role", "cliente")

    our_token = create_access_token({
        "sub": supabase_user_id,
        "email": email,
        "role": role
    })

    return TokenResponse(
        access_token=our_token,
        user=UserResponse(
            id=supabase_user_id,
            email=email,
            full_name=profile.get("full_name"),
            role=role,
            empresa=profile.get("empresa"),
            created_at=profile.get("created_at")
        )
    )


@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(data: dict) -> dict:
    """Reset password using Supabase recovery token"""
    token = data.get("token")
    email = data.get("email")
    new_password = data.get("new_password")

    if not all([token, email, new_password]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token, email y nueva contraseña son requeridos"
        )

    client = get_supabase()

    from jose import jwt

    try:
        payload = jwt.decode(token, options={"verify_signature": False})
        user_id = payload.get("sub")
        token_email = payload.get("email")
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token inválido"
        )

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token inválido"
        )

    response = httpx.put(
        f"{client.url}/auth/v1/admin/users/{user_id}",
        headers={
            "apikey": client.service_key,
            "Authorization": f"Bearer {client.service_key}",
            "Content-Type": "application/json",
        },
        json={
            "password": new_password
        },
        timeout=30.0
    )

    if response.status_code not in (200, 201):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se pudo cambiar la contraseña. El enlace puede haber expirado."
        )

    return {"message": "Contraseña cambiada correctamente"}


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(data: dict) -> dict:
    """Send password reset email via Supabase"""
    email = data.get("email")

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email es requerido"
        )

    client = get_supabase()

    response = httpx.post(
        f"{client.url}/auth/v1/recover",
        headers={
            "apikey": client.service_key,
            "Content-Type": "application/json",
        },
        json={
            "email": email
        },
        timeout=30.0
    )

    if response.status_code not in (0, 200):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se pudo enviar el email de recuperación"
        )

    return {"message": "Se envió un email para recuperar la contraseña"}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: Annotated[dict, Depends(get_current_user)]) -> UserResponse:
    client = get_supabase()
    response = httpx.get(
        f"{client.url}/rest/v1/profiles?id=eq.{current_user['user_id']}",
        headers=client.service_headers,
        timeout=30.0
    )

    profile_data = response.json()
    if not profile_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Perfil no encontrado"
        )

    profile = profile_data[0]

    return UserResponse(
        id=profile["id"],
        email=profile["email"],
        full_name=profile.get("full_name"),
        role=profile.get("role", "cliente"),
        empresa=profile.get("empresa"),
        created_at=profile.get("created_at")
    )


@router.put("/me", response_model=UserResponse)
async def update_me(
    current_user: Annotated[dict, Depends(get_current_user)],
    updates: dict
) -> UserResponse:
    client = get_supabase()

    update_data = {}
    if "full_name" in updates:
        update_data["full_name"] = updates["full_name"]
    if "empresa" in updates:
        update_data["empresa"] = updates["empresa"]
    update_data["updated_at"] = "now()"

    response = httpx.patch(
        f"{client.url}/rest/v1/profiles?id=eq.{current_user['user_id']}",
        headers=client.service_headers,
        json=update_data,
        timeout=30.0
    )

    if response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Perfil no encontrado"
        )

    profile = response.json()[0]

    return UserResponse(
        id=profile["id"],
        email=profile["email"],
        full_name=profile.get("full_name"),
        role=profile.get("role", "cliente"),
        empresa=profile.get("empresa"),
        created_at=profile.get("created_at")
    )