.PHONY: help up down logs api web migrate test

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

up: ## Start all services
	docker compose up -d

down: ## Stop all services
	docker compose down

logs: ## Tail logs
	docker compose logs -f

api: ## Run API locally
	cd apps/api && uvicorn app.main:app --reload --port 8000

web: ## Run web locally
	cd apps/web && npm run dev

install: ## Install dependencies
	cd apps/api && pip install -r requirements.txt
	cd apps/web && npm install

test-api: ## Run API tests
	cd apps/api && pytest -v

migrate: ## Run database migrations
	cd apps/api && alembic upgrade head
