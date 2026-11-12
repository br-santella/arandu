"""Provider-agnostic AI client.

Talks to any OpenAI-compatible endpoint (Ollama, hosted open models or a
commercial API). Switching providers is configuration only (.env).
"""

from __future__ import annotations

import json
from typing import TypeVar

import httpx
from pydantic import BaseModel, ValidationError

T = TypeVar("T", bound=BaseModel)


class StructuredOutputError(RuntimeError):
    """The model did not return valid JSON for the schema after all retries.

    Callers must route the excerpt to manual review instead of guessing.
    """


class EmbeddingDimensionError(RuntimeError):
    """The embedding size does not match content_chunk.embedding."""


def _headers(api_key: str | None) -> dict[str, str]:
    return {"Authorization": f"Bearer {api_key}"} if api_key else {}


class ChatClient:
    def __init__(
        self,
        base_url: str,
        model: str,
        api_key: str | None = None,
        timeout_seconds: float = 30.0,
        http: httpx.Client | None = None,
        reasoning_effort: str | None = None,
    ) -> None:
        self.model = model  # exact tag, stored in ai_proposal.model
        # e.g. "none" to disable "thinking" on reasoning models; None = provider default.
        self.reasoning_effort = reasoning_effort
        self._base_url = base_url.rstrip("/")
        self._http = http or httpx.Client(timeout=timeout_seconds)
        self._headers = _headers(api_key)

    def structured(
        self,
        messages: list[dict[str, str]],
        schema: type[T],
        max_retries: int = 2,
    ) -> T:
        """Return a response validated against `schema`.

        Uses deterministic sampling and a JSON Schema response format. Invalid
        output is retried up to `max_retries` times, then StructuredOutputError
        is raised.

        Penalties are forced to 0: some model packages ship with
        presence_penalty > 0, which pushes the model to reword text and breaks
        the literal-excerpt rule (docs/06).
        """
        payload: dict = {
            "model": self.model,
            "messages": messages,
            "temperature": 0,
            "top_p": 1,
            "presence_penalty": 0,
            "frequency_penalty": 0,
            "response_format": {
                "type": "json_schema",
                "json_schema": {
                    "name": schema.__name__,
                    "schema": schema.model_json_schema(),
                    "strict": True,
                },
            },
        }
        if self.reasoning_effort is not None:
            payload["reasoning_effort"] = self.reasoning_effort
        last_error: Exception | None = None
        for _ in range(max_retries + 1):
            response = self._http.post(
                f"{self._base_url}/chat/completions", json=payload, headers=self._headers
            )
            response.raise_for_status()
            content = response.json()["choices"][0]["message"]["content"]
            try:
                return schema.model_validate_json(content)
            except (ValidationError, json.JSONDecodeError) as exc:
                last_error = exc
        raise StructuredOutputError(
            f"invalid structured output after {max_retries + 1} attempts"
        ) from last_error


class EmbeddingClient:
    def __init__(
        self,
        base_url: str,
        model: str,
        dim: int,
        api_key: str | None = None,
        timeout_seconds: float = 30.0,
        http: httpx.Client | None = None,
        query_instruction: str | None = None,
    ) -> None:
        self.model = model
        self.dim = dim
        # Asymmetric models (e.g. qwen3-embedding) need an instruction on queries
        # only. Must be identical in the pipeline and in the guide Edge Function.
        self.query_instruction = query_instruction
        self._base_url = base_url.rstrip("/")
        self._http = http or httpx.Client(timeout=timeout_seconds)
        self._headers = _headers(api_key)

    def embed_query(self, query: str) -> list[float]:
        """Embed a user question (adds the query instruction, if any)."""
        text = (
            f"Instruct: {self.query_instruction}\nQuery: {query}"
            if self.query_instruction
            else query
        )
        return self.embed([text])[0]

    def embed(self, texts: list[str]) -> list[list[float]]:
        """Embed documents/chunks as-is (no instruction)."""
        if not texts:
            return []
        response = self._http.post(
            f"{self._base_url}/embeddings",
            json={"model": self.model, "input": texts},
            headers=self._headers,
        )
        response.raise_for_status()
        data = sorted(response.json()["data"], key=lambda item: item["index"])
        vectors = [item["embedding"] for item in data]
        if len(vectors) != len(texts):
            raise EmbeddingDimensionError(f"expected {len(texts)} vectors, got {len(vectors)}")
        for vector in vectors:
            if len(vector) != self.dim:
                raise EmbeddingDimensionError(
                    f"model {self.model} returned {len(vector)} dims, expected {self.dim}"
                )
        return vectors
