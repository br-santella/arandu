"""Settings loaded from the repository .env (see .env.example)."""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

REPO_ROOT = Path(__file__).resolve().parents[2]


def _get(name: str, default: str | None = None) -> str | None:
    value = os.environ.get(name)
    return value if value not in (None, "") else default


@dataclass(frozen=True)
class LLMSettings:
    base_url: str
    model: str
    api_key: str | None
    timeout_seconds: float
    reasoning_effort: str | None


@dataclass(frozen=True)
class EmbeddingSettings:
    base_url: str
    model: str
    dim: int
    api_key: str | None
    query_instruction: str | None


@dataclass(frozen=True)
class Settings:
    llm: LLMSettings
    embedding: EmbeddingSettings


def load_settings(env_file: Path | None = None) -> Settings:
    """Load settings from env vars, reading the repo .env first if present.

    Raises ValueError if LLM_MODEL is missing: the exact model tag must be
    pinned explicitly so results are traceable (ai_proposal.model).
    """
    load_dotenv(env_file or REPO_ROOT / ".env", override=False)

    model = _get("LLM_MODEL")
    if model is None:
        raise ValueError("LLM_MODEL is not set; pin an exact model tag in .env")

    return Settings(
        llm=LLMSettings(
            base_url=_get("LLM_BASE_URL", "http://localhost:11434/v1"),
            model=model,
            api_key=_get("LLM_API_KEY"),
            timeout_seconds=float(_get("LLM_TIMEOUT_SECONDS", "30")),
            reasoning_effort=_get("LLM_REASONING_EFFORT"),
        ),
        embedding=EmbeddingSettings(
            base_url=_get("EMBEDDING_BASE_URL", "http://localhost:11434/v1"),
            model=_get("EMBEDDING_MODEL", "qwen3-embedding:0.6b"),
            dim=int(_get("EMBEDDING_DIM", "1024")),
            api_key=_get("EMBEDDING_API_KEY"),
            query_instruction=_get("EMBEDDING_QUERY_INSTRUCTION"),
        ),
    )
