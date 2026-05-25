from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://a2a:a2asecret@localhost:5432/a2a_registry"
    DATABASE_URL_SYNC: str = "postgresql://a2a:a2asecret@localhost:5432/a2a_registry"

    JWT_SECRET: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60

    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    API_RELOAD: bool = True
    CORS_ORIGINS: str = "http://localhost:3000"

    AGENT_CARD_FETCH_TIMEOUT: int = 10
    MAX_REDIRECTS: int = 3
    VALIDATION_SCHEDULE_MINUTES: int = 60

    WORKER_CONCURRENCY: int = 4

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
