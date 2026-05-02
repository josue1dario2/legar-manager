from datetime import date, datetime
from pydantic import BaseModel, Field


class UserBase(BaseModel):
    email: str
    full_name: str | None = None
    empresa: str | None = None


class UserCreate(BaseModel):
    email: str
    password: str = Field(min_length=6)
    full_name: str | None = None
    empresa: str | None = None


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str | None = None
    role: str
    empresa: str | None = None
    created_at: datetime | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class RegistroBase(BaseModel):
    expediente: str
    nsiniestro: str | None = None
    actor: str
    tipo: str = "Conciliación Obligatoria"
    fechaderivacion: date | None = None
    fecharecepcion: date | None = None
    vencimiento: date | None = None
    juzgado: str | None = None
    prioridad: str = "Media"
    oblea: str | None = None
    fechadespacho: date | None = None
    estado: str = "PENDIENTE"
    alertas_activas: bool = True


class RegistroCreate(RegistroBase):
    pass


class RegistroUpdate(BaseModel):
    expediente: str | None = None
    nsiniestro: str | None = None
    actor: str | None = None
    tipo: str | None = None
    fechaderivacion: date | None = None
    fecharecepcion: date | None = None
    vencimiento: date | None = None
    juzgado: str | None = None
    prioridad: str | None = None
    oblea: str | None = None
    fechadespacho: date | None = None
    estado: str | None = None
    alertas_activas: bool | None = None


class RegistroResponse(RegistroBase):
    id: str
    user_id: str
    created_at: datetime | None = None
    updated_at: datetime | None = None


class StatsResponse(BaseModel):
    total: int
    vencen_pronto: int
    pendientes: int
    despachados: int


class AlertaBase(BaseModel):
    tipo: str
    mensaje: str


class AlertaResponse(AlertaBase):
    id: str
    user_id: str
    registro_id: str | None = None
    leida: bool
    created_at: datetime | None = None


class AlertaUpdate(BaseModel):
    leida: bool | None = None


class AdminUserResponse(BaseModel):
    id: str
    email: str
    full_name: str | None = None
    role: str
    empresa: str | None = None
    created_at: datetime | None = None
    total_registros: int | None = None