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


def test_structured_forces_zero_penalties_for_literal_excerpts():
    seen = {}

    def handler(request):
        seen["body"] = json.loads(request.content)
        return chat_reply(VALID)

    make_chat(handler).structured([], Place)
    body = seen["body"]
    assert body["presence_penalty"] == 0
    assert body["frequency_penalty"] == 0
    assert body["top_p"] == 1
    assert "reasoning_effort" not in body  # provider default unless configured


def test_structured_sends_reasoning_effort_when_configured():
    seen = {}

    def handler(request):
        seen["body"] = json.loads(request.content)
        return chat_reply(VALID)

    http = httpx.Client(transport=httpx.MockTransport(handler))
    client = ChatClient("http://llm.test/v1", "m", http=http, reasoning_effort="none")
    client.structured([], Place)
    assert seen["body"]["reasoning_effort"] == "none"


def test_embed_query_adds_instruction_but_documents_do_not():
    inputs = []

    def handler(request):
        body = json.loads(request.content)
        inputs.append(body["input"])
        return httpx.Response(
            200,
            json={
                "data": [{"index": i, "embedding": [1, 0, 0]} for i in range(len(body["input"]))]
            },
        )

    http = httpx.Client(transport=httpx.MockTransport(handler))
    client = EmbeddingClient(
        "http://emb.test/v1", "m", dim=3, http=http, query_instruction="Busque"
    )
    client.embed_query("pergunta")
    client.embed(["documento"])
    assert inputs == [["Instruct: Busque\nQuery: pergunta"], ["documento"]]


def test_embed_query_without_instruction_is_plain():
    inputs = []

    def handler(request):
        inputs.append(json.loads(request.content)["input"])
        return httpx.Response(200, json={"data": [{"index": 0, "embedding": [1, 0, 0]}]})

    make_embed(handler).embed_query("pergunta")
    assert inputs == [["pergunta"]]
