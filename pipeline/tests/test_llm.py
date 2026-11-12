import json

import httpx
import pytest
from pydantic import BaseModel

from arandu_pipeline.llm import (
    ChatClient,
    EmbeddingClient,
    EmbeddingDimensionError,
    StructuredOutputError,
)


class Place(BaseModel):
    name: str
    excerpt: str


def chat_reply(content: str) -> httpx.Response:
    return httpx.Response(200, json={"choices": [{"message": {"content": content}}]})


def make_chat(handler, api_key=None) -> ChatClient:
    http = httpx.Client(transport=httpx.MockTransport(handler))
    return ChatClient("http://llm.test/v1/", "test-model:tag", api_key=api_key, http=http)


VALID = json.dumps({"name": "[TESTE]", "excerpt": "[TESTE]"})


def test_structured_sends_schema_and_temperature_zero():
    seen = {}

    def handler(request):
        seen["url"] = str(request.url)
        seen["body"] = json.loads(request.content)
        seen["auth"] = request.headers.get("authorization")
        return chat_reply(VALID)

    result = make_chat(handler).structured([{"role": "user", "content": "x"}], Place)

    assert result == Place(name="[TESTE]", excerpt="[TESTE]")
    assert seen["url"] == "http://llm.test/v1/chat/completions"
    assert seen["body"]["temperature"] == 0
    assert seen["body"]["model"] == "test-model:tag"
    assert seen["body"]["response_format"]["json_schema"]["schema"] == Place.model_json_schema()
    assert seen["auth"] is None  # no key -> no header (Ollama)


def test_structured_sends_bearer_when_api_key_set():
    seen = {}

    def handler(request):
        seen["auth"] = request.headers.get("authorization")
        return chat_reply(VALID)

    make_chat(handler, api_key="secret").structured([], Place)
    assert seen["auth"] == "Bearer secret"


def test_structured_retries_invalid_output_then_succeeds():
    replies = iter([chat_reply("not json"), chat_reply('{"name": 1}'), chat_reply(VALID)])
    result = make_chat(lambda request: next(replies)).structured([], Place, max_retries=2)
    assert result.name == "[TESTE]"


def test_structured_gives_up_after_retries():
    calls = []

    def handler(request):
        calls.append(1)
        return chat_reply("not json")

    with pytest.raises(StructuredOutputError):
        make_chat(handler).structured([], Place, max_retries=2)
    assert len(calls) == 3


def test_structured_raises_on_http_error():
    with pytest.raises(httpx.HTTPStatusError):
        make_chat(lambda request: httpx.Response(500)).structured([], Place)


def make_embed(handler, dim=3) -> EmbeddingClient:
    http = httpx.Client(transport=httpx.MockTransport(handler))
    return EmbeddingClient("http://emb.test/v1", "bge-m3", dim=dim, http=http)


def test_embed_returns_vectors_in_input_order():
    def handler(request):
        return httpx.Response(
            200,
            json={
                "data": [{"index": 1, "embedding": [0, 0, 1]}, {"index": 0, "embedding": [1, 0, 0]}]
            },
        )

    assert make_embed(handler).embed(["a", "b"]) == [[1, 0, 0], [0, 0, 1]]


def test_embed_rejects_wrong_dimension():
    def handler(request):
        return httpx.Response(200, json={"data": [{"index": 0, "embedding": [1, 0]}]})

    with pytest.raises(EmbeddingDimensionError):
        make_embed(handler).embed(["a"])


def test_embed_empty_input_makes_no_request():
    def handler(request):
        raise AssertionError("no request expected")

    assert make_embed(handler).embed([]) == []
