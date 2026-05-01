"""
Model router: Groq → Gemini → OpenRouter fallback
Updated model names April 2026:
  Groq: llama-3.3-70b-versatile (stream), llama-3.1-8b-instant (complete)
  Gemini: gemini-2.0-flash via new google-genai SDK
  OpenRouter: meta-llama/llama-3.2-3b-instruct:free (free tier)
"""
import os
import logging
from typing import Generator

log = logging.getLogger(__name__)

KEY_MAP = {
    "groq":        "GROQ_API_KEY",
    "gemini":      "GEMINI_API_KEY",
    "openrouter":  "OPENROUTER_API_KEY",
}
AUTO_ORDER = ["groq", "gemini", "openrouter"]
MAX_CONTEXT_CHARS = 7000

RAG_SYSTEM_PROMPT = """You are DocuMind AI — a highly intelligent document analyst and assistant.

RULES:
1. Answer PRIMARILY from the document context provided below.
   Cite page numbers: (Page X) when referencing specific content.
2. If the question is NOT in the document, answer from your knowledge and say:
   "This isn't in your document, but based on general knowledge: ..."
3. Never hallucinate document-specific facts (names, numbers, dates).
4. Be concise for simple questions, detailed for complex ones.
5. For medical docs: extract drug names, dosages, patient info precisely.
6. For financial docs: extract exact numbers, dates, party names.
7. Always give helpful, complete answers. Suggest next steps when relevant.

DOCUMENT CONTEXT:
{context}"""


def _trim_context(chunks: list[dict]) -> str:
    parts, total = [], 0
    for c in chunks:
        text = f"[Page {c.get('page_num','?')}]\n{c.get('content','')}"
        if total + len(text) > MAX_CONTEXT_CHARS:
            break
        parts.append(text)
        total += len(text)
    return "\n\n---\n\n".join(parts) if parts else "No document context available."


def _is_rate_limit(exc: Exception) -> bool:
    return any(k in str(exc).lower() for k in ["429", "rate limit", "quota", "too many", "exceeded"])


def _is_auth_error(exc: Exception) -> bool:
    return any(k in str(exc).lower() for k in ["401", "403", "invalid api key", "unauthorized"])


# ── GROQ ─────────────────────────────────────────────────────────────────────
def _groq_stream(messages, max_tokens):
    from groq import Groq
    client = Groq(api_key=os.environ["GROQ_API_KEY"])
    stream = client.chat.completions.create(
        model="llama-3.3-70b-versatile",  # current production model
        messages=messages, max_tokens=max_tokens, temperature=0.15, stream=True,
    )
    for chunk in stream:
        token = chunk.choices[0].delta.content or ""
        if token:
            yield token


def _groq_complete(messages, max_tokens, json_mode=False):
    from groq import Groq
    client = Groq(api_key=os.environ["GROQ_API_KEY"])
    kwargs = {"response_format": {"type": "json_object"}} if json_mode else {}
    resp = client.chat.completions.create(
        model="llama-3.1-8b-instant",  # fast, current production model
        messages=messages, max_tokens=max_tokens, temperature=0.1, **kwargs,
    )
    return resp.choices[0].message.content


# ── GEMINI (new google-genai SDK) ─────────────────────────────────────────────
def _gemini_stream(messages, max_tokens):
    from google import genai
    from google.genai import types
    client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

    # Build prompt from messages
    system_text = ""
    conversation = []
    for m in messages:
        if m["role"] == "system":
            system_text = m["content"]
        elif m["role"] == "user":
            conversation.append(m["content"])
        elif m["role"] == "assistant":
            conversation.append(f"Assistant: {m['content']}")

    full_prompt = (system_text + "\n\n" if system_text else "") + "\n".join(conversation)

    for chunk in client.models.generate_content_stream(
        model="gemini-2.0-flash",
        contents=full_prompt,
        config=types.GenerateContentConfig(max_output_tokens=max_tokens, temperature=0.15),
    ):
        if chunk.text:
            yield chunk.text


def _gemini_complete(messages, max_tokens):
    from google import genai
    from google.genai import types
    client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    prompt = "\n".join(f"{m['role'].upper()}: {m['content']}" for m in messages)
    resp = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=prompt,
        config=types.GenerateContentConfig(max_output_tokens=max_tokens, temperature=0.1),
    )
    return resp.text


# ── OPENROUTER (free tier fallback) ───────────────────────────────────────────
def _openrouter_stream(messages, max_tokens):
    from openai import OpenAI
    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=os.environ["OPENROUTER_API_KEY"],
    )
    stream = client.chat.completions.create(
        model="meta-llama/llama-3.2-3b-instruct:free",  # free tier, always available
        messages=messages, max_tokens=max_tokens, temperature=0.15, stream=True,
    )
    for chunk in stream:
        token = chunk.choices[0].delta.content or ""
        if token:
            yield token


def _openrouter_complete(messages, max_tokens):
    from openai import OpenAI
    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=os.environ["OPENROUTER_API_KEY"],
    )
    resp = client.chat.completions.create(
        model="meta-llama/llama-3.2-3b-instruct:free",
        messages=messages, max_tokens=max_tokens, temperature=0.1,
    )
    return resp.choices[0].message.content


STREAM_FNS  = {"groq": _groq_stream,    "gemini": _gemini_stream,    "openrouter": _openrouter_stream}
COMPLETE_FNS = {"groq": _groq_complete, "gemini": _gemini_complete,  "openrouter": _openrouter_complete}


def build_rag_messages(question: str, chunks: list[dict], history: list[dict] | None = None) -> list[dict]:
    context = _trim_context(chunks)
    messages: list[dict] = [{"role": "system", "content": RAG_SYSTEM_PROMPT.format(context=context)}]
    if history:
        for h in history[-6:]:
            if h.get("role") in ("user", "assistant") and h.get("content"):
                messages.append({"role": h["role"], "content": h["content"]})
    messages.append({"role": "user", "content": question})
    return messages


def stream_complete(messages: list[dict], max_tokens: int = 1024, model_preference: str = "auto") -> Generator[str, None, None]:
    order = [model_preference] if model_preference != "auto" else AUTO_ORDER
    last_error = None
    for provider in order:
        if not os.environ.get(KEY_MAP.get(provider, "")):
            log.warning("Skipping %s — no API key", provider)
            continue
        try:
            log.info("Streaming via %s", provider)
            yield from STREAM_FNS[provider](messages, max_tokens)
            return
        except Exception as exc:
            log.warning("%s failed (%s) — trying next", provider, exc)
            last_error = exc
            if _is_rate_limit(exc) or _is_auth_error(exc):
                continue
            if model_preference != "auto":
                raise
    raise RuntimeError(f"All models failed. Last: {last_error}")


def complete(messages: list[dict], max_tokens: int = 1024, json_mode: bool = False, model_preference: str = "auto") -> str:
    order = [model_preference] if model_preference != "auto" else AUTO_ORDER
    for provider in order:
        if not os.environ.get(KEY_MAP.get(provider, "")):
            continue
        try:
            if provider == "groq":
                return _groq_complete(messages, max_tokens, json_mode)
            return COMPLETE_FNS[provider](messages, max_tokens)
        except Exception as exc:
            if _is_rate_limit(exc) or _is_auth_error(exc):
                continue
            raise
    raise RuntimeError("All models failed.")