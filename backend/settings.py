from __future__ import annotations

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    mongodb_uri: str
    mongodb_db: str = "class_awards"
    mongodb_collection: str = "state"

    admin_password: str

    api_prefix: str = "/api"
    cors_origins: str = "*"

    # Load `.env` from repo root, regardless of current working directory.
    _repo_root = Path(__file__).resolve().parents[1]
    model_config = SettingsConfigDict(
        env_file=str(_repo_root / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    def parsed_cors_origins(self) -> list[str]:
        if self.cors_origins.strip() == "*":
            return ["*"]
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

