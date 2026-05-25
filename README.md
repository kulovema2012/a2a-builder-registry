# A2A Builder & Registry

A platform for creating, validating, registering, and discovering A2A-compatible agent services.

## Architecture

```
apps/
├── api/          FastAPI backend (Python)
│   ├── app/
│   │   ├── api/v1/endpoints/   API routes
│   │   ├── core/               Config, database
│   │   ├── models/             SQLAlchemy models
│   │   ├── schemas/            Pydantic schemas
│   │   └── services/           Business logic
│   └── requirements.txt
└── web/          Next.js frontend (TypeScript)
    └── src/
        ├── app/                Pages (App Router)
        ├── components/         UI components
        └── lib/                API client, utilities
```

## Quick Start

### Docker (recommended)

```bash
cp .env.example .env
docker compose up -d
```

- API: http://localhost:8000 (Swagger docs at `/docs`)
- Web: http://localhost:3000

### Manual

**Backend:**

```bash
cd apps/api
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend:**

```bash
cd apps/web
npm install
npm run dev
```

**Database:**

Requires PostgreSQL 16+. Create a database:

```sql
CREATE DATABASE a2a_registry;
```

Tables are auto-created on first startup. For production, use Alembic migrations.

## API Surface

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/services` | Create a service |
| POST | `/api/v1/services/import` | Import from Agent Card URL |
| GET | `/api/v1/services` | Search/filter services |
| GET | `/api/v1/services/{id}` | Get service details |
| PATCH | `/api/v1/services/{id}` | Update service |
| DELETE | `/api/v1/services/{id}` | Delete service |
| POST | `/api/v1/services/{id}/agent-card/generate` | Generate Agent Card |
| GET | `/api/v1/services/{id}/agent-card` | Get latest snapshot |
| POST | `/api/v1/services/{id}/validate` | Run validation |
| GET | `/api/v1/services/{id}/validation-runs` | Validation history |
| POST | `/api/v1/services/{id}/endpoints` | Add endpoint |
| POST | `/api/v1/services/{id}/skills` | Add skill |
| GET | `/api/v1/registry/agents` | Discovery endpoint |
| POST | `/api/v1/registry/services/{id}/publish-request` | Request publication |
| POST | `/api/v1/admin/services/{id}/approve` | Approve listing |
| POST | `/api/v1/admin/services/{id}/suspend` | Suspend listing |
| POST | `/api/v1/test-console/send` | Send test A2A request |

## Key Features

- **Agent Card Import**: Fetch and parse any A2A Agent Card URL
- **Validation Engine**: Schema checks, endpoint reachability, security auditing
- **Guided Builder**: Step-by-step Agent Card creation wizard
- **Registry Discovery**: Machine-readable endpoint for client-agent consumption
- **Test Console**: Send sample A2A JSON-RPC requests
- **Admin Governance**: Approve, reject, suspend service listings
- **Audit Events**: Full history of all service lifecycle actions

## Tech Stack

- **Backend**: Python 3.12, FastAPI, SQLAlchemy 2.0 (async), Pydantic v2
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS 4
- **Database**: PostgreSQL 16
- **HTTP Client**: httpx (async)
- **Container**: Docker + Docker Compose
