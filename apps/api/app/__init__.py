# A2A Builder & Registry API

## Setup

```bash
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
```

## Run

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API Docs

Once running, visit `http://localhost:8000/docs` for Swagger UI.
