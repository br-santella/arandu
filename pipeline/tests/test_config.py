import pytest

from arandu_pipeline.config import load_settings

ENV_VARS = [
    "LLM_BASE_URL",
    "LLM_MODEL",
    "LLM_API_KEY",
    "LLM_TIMEOUT_SECONDS",
    "EMBEDDING_BASE_URL",
    "EMBEDDING_MODEL",
    "EMBEDDING_DIM",
    "EMBEDDING_API_KEY",
    "EMBEDDING_QUERY_INSTRUCTION",
    "LLM_REASONING_EFFORT",
]


@pytest.fixture
def clean_env(monkeypatch, tmp_path):
    for name in ENV_VARS:
        monkeypatch.delenv(name, raising=False)
    return tmp_path / "missing.env"  # isolate from the real repo .env


def test_requires_pinned_model(clean_env):
    with pytest.raises(ValueError, match="LLM_MODEL"):
        load_settings(clean_env)


def test_defaults_point_to_local_ollama(clean_env, monkeypatch):
    monkeypatch.setenv("LLM_MODEL", "test-model:tag")
    monkeypatch.setenv("LLM_API_KEY", "")  # empty means no key

    settings = load_settings(clean_env)

    assert settings.llm.base_url == "http://localhost:11434/v1"
    assert settings.llm.api_key is None
    assert settings.embedding.model == "qwen3-embedding:0.6b"
    assert settings.embedding.query_instruction is None
    assert settings.llm.reasoning_effort is None
    assert settings.embedding.dim == 1024
