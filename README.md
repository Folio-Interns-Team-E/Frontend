# AI Sales Pipeline Agent

AI Sales Pipeline Agent is a full-stack sales workflow application with a React/TanStack frontend and a FastAPI backend. It helps teams manage authentication, team membership, onboarding/ICP generation, leads, outreach emails, Gmail integration, meetings, proposals, knowledge assets, and AI chat.

## Repository Structure

```text
.
+-- Backend_Sales_Sync/
|   +-- app/
|   |   +-- core/              # Security helpers and shared backend utilities
|   |   +-- middleware/        # Authentication and authorization dependencies
|   |   +-- models/            # SQLAlchemy ORM models
|   |   +-- routers/           # FastAPI route modules
|   |   +-- schemas/           # Pydantic request/response schemas
|   |   +-- services/          # Business logic and external integrations
|   |   +-- config.py          # Environment-driven application settings
|   |   +-- database.py        # Async SQLAlchemy engine/session setup
|   |   +-- main.py            # FastAPI application entry point
|   +-- migrations/            # Alembic migration environment
|   +-- .env.example           # Example backend environment variables
|   +-- alembic.ini            # Alembic configuration
|   +-- docker-compose.yml     # Local PostgreSQL service
|   +-- docs.md                # Detailed backend/API notes
|   +-- generate_erd.py        # ER diagram generation helper
|   +-- pyproject.toml         # Python package and dependency metadata
|   +-- uv.lock                # Locked backend dependency versions
+-- Frontend/
    +-- public/                # Static image/logo assets
    +-- src/
    |   +-- components/        # Shared app and UI components
    |   +-- hooks/             # Frontend React hooks
    |   +-- lib/               # API client and shared utilities
    |   +-- routes/            # TanStack file-based routes
    |   +-- store/             # Redux store, slices, and async thunks
    |   +-- router.tsx         # Router setup
    |   +-- styles.css         # Global styles and Tailwind entry
    +-- package.json           # Frontend scripts and dependencies
    +-- vite.config.ts         # Vite/TanStack Start configuration
    +-- components.json        # UI component configuration
```

## Backend Overview

The backend is a FastAPI application named `AI Sales Pipeline Agent`. It uses async SQLAlchemy with PostgreSQL and exposes OpenAPI docs at `/docs` and ReDoc at `/redoc`.

Main backend areas:

- `app/routers`: HTTP endpoints grouped by feature, including `auth`, `teams`, `onboarding`, `leads`, `emails`, `meetings`, `proposals`, `knowledge_base`, `chat`, and `integrations`.
- `app/services`: Business logic for each router plus external services such as Gmail, Cal.com, S3, and Grok/AI support.
- `app/models`: SQLAlchemy models for users, teams, team members, leads, emails, meetings, proposals, knowledge assets, chat messages, and Google credentials.
- `app/schemas`: Pydantic schemas used to validate request bodies and shape responses.
- `app/middleware/auth_middleware.py`: JWT-based current-user and role checks.
- `app/config.py`: Loads settings from environment variables via Pydantic settings.
- `app/database.py`: Creates the async database engine and request-scoped sessions.

The backend returns a consistent response shape:

```json
{
  "success": true,
  "message": "Operation completed",
  "data": {},
  "error": null
}
```

Errors follow the same structure with `success: false`.

## Frontend Overview

The frontend is a React 19 application built with Vite, TanStack Start/Router, Redux Toolkit, Tailwind CSS, Radix UI primitives, and lucide-react icons.

Main frontend areas:

- `src/routes`: File-based routes. Marketing routes, auth routes, and app routes are grouped with TanStack route conventions.
- `src/components`: Shared layout and feature components such as `Sidebar`, `TopBar`, `LandingHeader`, `AuthLayout`, and `AIChatPanel`.
- `src/components/ui`: Reusable UI primitives.
- `src/lib/api.ts`: Central API client. It reads `VITE_API_URL`, defaults to `/api`, and attaches bearer tokens when provided.
- `src/store`: Redux store setup, hooks, app slice, and async thunks.
- `vite.config.ts`: Proxies `/api` to `http://127.0.0.1:8000` during local development.

## Key Features

- User registration, login, logout, and JWT authentication
- Team creation, joining by invite code, member invitations, and role management
- Onboarding flow for product/customer input and ICP generation
- Lead creation, qualification, filtering, and status management
- Email drafts and sending workflows, including Gmail OAuth integration support
- Meeting scheduling and meeting record updates
- Proposal creation, proposal revision tracking, and template uploads
- Knowledge base asset uploads and management
- AI chat endpoint backed by the backend service layer
- PostgreSQL persistence with SQLAlchemy models and Alembic migration support

## Requirements

- Python 3.12 or newer
- `uv` for backend dependency management
- Node.js and npm for the frontend
- Docker, if you want to run PostgreSQL with the included Compose file
- PostgreSQL 16 or another compatible PostgreSQL server

## Backend Setup

From the repository root:

```bash
cd Backend_Sales_Sync
cp .env.example .env
uv sync
```

Start the local PostgreSQL database:

```bash
docker compose up -d db
```

Run database migrations if migration files are present:

```bash
uv run alembic upgrade head
```

Start the API:

```bash
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Useful backend URLs:

- API health check: `http://localhost:8000/health`
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

Note: `app/main.py` also creates tables on startup with `Base.metadata.create_all`, but Alembic should still be used for deliberate schema changes.

## Frontend Setup

From the repository root:

```bash
cd Frontend
npm install
npm run dev
```

The Vite dev server usually runs at:

```text
http://localhost:5173
```

During local development, frontend calls to `/api` are proxied to the backend at `http://127.0.0.1:8000`.

## Environment Variables

Backend variables are defined in `Backend_Sales_Sync/.env.example`. The most important values are:

```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/sales_agent
JWT_SECRET=change-this-in-production
APP_ENV=development
FRONTEND_ORIGINS=["http://localhost:5173","http://127.0.0.1:5173"]
```

Optional backend integrations:

```env
GROK_API_KEY=
APOLLO_API_KEY=
PINECONE_API_KEY=
PINECONE_INDEX_NAME=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_BUCKET_NAME=
AWS_REGION=
CAL_API_KEY=
CAL_EVENT_TYPE_ID=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_GROWTH_PRICE=
STRIPE_ENTERPRISE_PRICE=
```

Frontend variables:

```env
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id
```

If `VITE_API_URL` is omitted during local Vite development, the frontend uses `/api`, which is proxied by `vite.config.ts`.

## Common Commands

Backend:

```bash
cd Backend_Sales_Sync
uv sync
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
uv run alembic upgrade head
uv run alembic revision --autogenerate -m "describe change"
docker compose up -d db
docker compose down
```

Frontend:

```bash
cd Frontend
npm install
npm run dev
npm run build
npm run preview
npm run lint
npm run format
```

## Development Notes

- Keep backend route handlers thin and place business rules in `app/services`.
- Add or update Pydantic schemas in `app/schemas` when request or response shapes change.
- Add SQLAlchemy model changes in `app/models`, then create an Alembic migration.
- Frontend routes belong in `Frontend/src/routes`; `routeTree.gen.ts` is generated and should not be edited by hand.
- The frontend API surface should stay centralized in `Frontend/src/lib/api.ts`.
- For new protected backend endpoints, use the auth dependencies in `app/middleware/auth_middleware.py`.
- Do not commit local `.env` files or real API keys.

## More Documentation

- Backend API and architecture notes: `Backend_Sales_Sync/docs.md`
- Frontend routing conventions: `Frontend/src/routes/README.md`
- ER diagram assets: `Backend_Sales_Sync/erd.png` and `Backend_Sales_Sync/erd1.png`
