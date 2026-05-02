# SPEC.md - Legal Manager SaaS

## 1. Concept & Vision

Sistema SaaS multiusuario para gestión de trámites legales y logísticos con autenticación separada para administradores y clientes. Cada cliente gestiona sus propios registros con vencimientos y alertas. Interfaz profesional, eficiente, tipo dashboard de control.

## 2. Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Python FastAPI
- **Database**: PostgreSQL via Supabase
- **Auth**: JWT con Supabase Auth

## 3. Design Language

**Colors**:
- Primary: `#4F46E5` (indigo-600)
- Secondary: `#0F172A` (slate-900)
- Background: `#F8FAFC` (slate-50)
- Card: `#FFFFFF`
- Border: `#E2E8F0`

**Typography**: System fonts (Inter fallback)

**Spacing**: 4px base unit, Tailwind utilities

## 4. Architecture

```
legal-manager-saas/
├── backend/
│   ├── app/
│   │   ├── api/          # auth.py, registros.py, alertas.py, admin.py
│   │   ├── core/         # security.py, supabase.py
│   │   ├── models/       # schemas.py
│   │   └── main.py       # FastAPI entrypoint
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/   # (unused, direct pages)
│   │   ├── context/      # AuthContext.jsx
│   │   ├── lib/          # api.js, utils.js
│   │   └── pages/        # auth/, cliente/, admin/
│   └── package.json
├── database/
│   └── schema.sql        # Supabase schema
└── docker-compose.yml
```

## 5. Data Model

**Supabase Auth → profiles** (auto-created on signup)
- id, email, full_name, role ('admin'|'cliente'), empresa, timestamps

**registros** (per user, RLS enforced)
- id, user_id, expediente, nSiniestro, actor, tipo, fechaDerivacion, fechaRecepcion, vencimiento, juzgado, prioridad, oblea, fechaDespacho, estado, alertas_activas, timestamps

**alertas** (per user)
- id, user_id, registro_id, tipo, mensaje, leida, created_at

## 6. API Endpoints

**Auth**:
- POST /api/v1/auth/register → TokenResponse
- POST /api/v1/auth/login → TokenResponse
- GET /api/v1/auth/me → UserResponse
- PUT /api/v1/auth/me → UserResponse

**Registros** (Cliente):
- GET /api/v1/registros → list[RegistroResponse]
- POST /api/v1/registros → RegistroResponse
- GET /api/v1/registros/{id} → RegistroResponse
- PUT /api/v1/registros/{id} → RegistroResponse
- DELETE /api/v1/registros/{id} → 204
- GET /api/v1/registros/stats → StatsResponse

**Alertas** (Cliente):
- GET /api/v1/alertas → list[AlertaResponse]
- PUT /api/v1/alertas/{id}/read → AlertaResponse
- PUT /api/v1/alertas/read-all → success

**Admin**:
- GET /api/v1/admin/users → list[AdminUserResponse]
- GET /api/v1/admin/registros → list[RegistroResponse]
- GET /api/v1/admin/stats → StatsResponse
- DELETE /api/v1/admin/users/{id} → 204

## 7. Pages

**Auth**:
- /login → LoginPage
- /register → RegisterPage

**Cliente**:
- /dashboard → DashboardPage (stats + recent + alerts banner)
- /registros → RegistrosPage (full table + pagination)
- /registros/new → RegistroFormPage
- /registros/:id → RegistroFormPage (edit mode)
- /alertas → AlertasPage (mark read, mark all read)

**Admin**:
- /admin/dashboard → AdminDashboardPage (global stats)
- /admin/clientes → AdminClientesPage (user management)
- /admin/registros → AdminRegistrosPage (all records)

## 8. Auth Flow

1. Login/Register → Supabase Auth
2. JWT returned with user_id + role
3. Frontend stores token + user in localStorage
4. Every request: Authorization: Bearer <token>
5. FastAPI validates JWT, extracts user
6. RLS in Supabase enforces data isolation

## 9. Environment Variables

**Backend**:
- SUPABASE_URL
- SUPABASE_KEY (publishable)
- SUPABASE_SERVICE_KEY
- JWT_SECRET (min 32 chars)
- ALERT_THRESHOLD_DAYS (default 3)

**Frontend**:
- VITE_API_URL (default http://localhost:8000/api/v1)
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY

## 10. Deployment

**Local**:
- Backend: `uvicorn app.main:app --reload --port 8000`
- Frontend: `npm run dev` (port 5173)

**Production** (future):
- Frontend: Vercel
- Backend: Railway/Render
- DB: Supabase Pro