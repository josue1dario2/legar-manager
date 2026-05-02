from datetime import datetime, timedelta, timezone
from typing import Annotated, Any
import httpx

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt

from app.config import settings


security = HTTPBearer()


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(hours=24))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm="HS256")


def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)]
) -> dict:
    token = credentials.credentials
    payload = decode_token(token)

    user_id = payload.get("sub")
    role = payload.get("role", "cliente")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido",
        )

    return {"user_id": user_id, "role": role}


async def verify_supabase_token(token: str) -> dict | None:
    """Verify a Supabase OAuth token and return user info"""
    try:
        response = httpx.get(
            f"https://xurfbvhxqhyybktwohtg.supabase.co/auth/v1/user",
            headers={
                "Authorization": f"Bearer {token}",
                "apikey": "sb_secret_O1sKFf-Od01I3POXnLM2PQ_jfqx_bjd"
            },
            timeout=30.0
        )
        if response.status_code == 200:
            return response.json()
        return None
    except:
        return None


async def get_admin_user(
    current_user: Annotated[dict, Depends(get_current_user)]
) -> dict:
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso solo para administradores",
        )
    return current_user


class SupabaseClient:
    """Direct HTTP client for Supabase REST API using new key format"""

    def __init__(self):
        self.url = settings.SUPABASE_URL
        self.key = settings.SUPABASE_KEY
        self.service_key = settings.SUPABASE_SERVICE_KEY
        self.service_headers = {
            "apikey": self.service_key,
            "Authorization": f"Bearer {self.service_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }

    def table(self, table_name: str) -> "TableQuery":
        return TableQuery(self, table_name)


class TableQuery:
    """Query builder for Supabase table operations"""

    def __init__(self, client: SupabaseClient, table_name: str):
        self.client = client
        self.table_name = table_name
        self.url = f"{client.url}/rest/v1/{table_name}"
        self.params = {}
        self.select_query = "*"

    def select(self, columns: str = "*") -> "TableQuery":
        self.select_query = columns
        return self

    def eq(self, column: str, value: Any) -> "TableQuery":
        self.params[f"{column}=eq.{value}"] = "true"
        return self

    def or_(self, condition: str) -> "TableQuery":
        self.params["or"] = condition
        return self

    def order(self, column: str, desc: bool = False) -> "TableQuery":
        order_str = f"{column}.desc" if desc else column
        self.params["order"] = order_str
        return self

    def range(self, start: int, end: int) -> "TableQuery":
        self.params["offset"] = str(start)
        self.params["limit"] = str(end - start + 1)
        return self

    def execute(self) -> dict:
        query_params = "&".join([f"{k}={v}" for k, v in self.params.items()])
        url = f"{self.url}?select={self.select_query}"
        if query_params:
            url += f"&{query_params}"

        response = httpx.get(url, headers=self.client.service_headers, timeout=30.0)

        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Query error: {response.text}"
            )

        return type('Response', (), {'data': response.json(), 'count': len(response.json())})()


def get_supabase() -> SupabaseClient:
    return SupabaseClient()


class SupabaseAuth:
    """Direct Supabase Auth API client using httpx"""

    def __init__(self):
        self.url = settings.SUPABASE_URL
        self.anon_key = settings.SUPABASE_KEY
        self.service_key = settings.SUPABASE_SERVICE_KEY

    def sign_in_with_password(self, email: str, password: str) -> dict:
        """Sign in with email/password"""
        response = httpx.post(
            f"{self.url}/auth/v1/token?grant_type=password",
            headers={
                "apikey": self.service_key,
                "Content-Type": "application/json",
            },
            json={
                "email": email,
                "password": password,
            },
            timeout=30.0
        )

        if response.status_code == 400:
            error_data = response.json()
            if "invalid_credentials" in str(error_data).lower():
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Credenciales inválidas"
                )

        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Auth error: {response.text}"
            )

        return response.json()

    def admin_create_user(self, email: str, password: str, metadata: dict = None) -> dict:
        """Create user using admin API"""
        response = httpx.post(
            f"{self.url}/auth/v1/admin/users",
            headers={
                "apikey": self.service_key,
                "Authorization": f"Bearer {self.service_key}",
                "Content-Type": "application/json",
            },
            json={
                "email": email,
                "password": password,
                "email_confirm": True,
                "user_metadata": metadata or {}
            },
            timeout=30.0
        )

        if response.status_code not in (200, 201):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Admin create user error: {response.text}"
            )

        return response.json()


supabase_auth = SupabaseAuth()