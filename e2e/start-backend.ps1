$ErrorActionPreference = "Stop"

$env:APP_ENV = "test"
$env:DATABASE_URL = "postgresql+asyncpg://postgres:postgres@127.0.0.1:5433/salessync_e2e"
$env:JWT_SECRET = "e2e-only-jwt-secret-do-not-use-outside-tests"
$env:FRONTEND_ORIGINS = '["http://127.0.0.1:5173"]'
$env:DB_ENCRYPTION_KEY = "MDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDA="
$env:FROM_EMAIL = "e2e@example.invalid"

uv run uvicorn app.main:app --host 127.0.0.1 --port 8000
