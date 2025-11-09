from dataclasses import dataclass
from typing import Dict, Any
import time
from tenacity import retry, stop_after_attempt, wait_exponential_jitter
from google import genai
from google.genai import types
from .config import GEMINI_API_KEY, GEMINI_MODEL, RPM

# Initialize once
_client = genai.Client(api_key=GEMINI_API_KEY)

# Response schema for strict JSON (Gemini structured outputs)
# Docs: https://ai.google.dev/gemini-api/docs/structured-output
_schema = types.Schema(
    type=types.Type.OBJECT,
    properties={
        "csat_1_5": types.Schema(type=types.Type.INTEGER),
        "sentiment_score": types.Schema(type=types.Type.NUMBER),
        "sentiment_label": types.Schema(
            type=types.Type.STRING,
            enum=["positive", "neutral", "negative", "mixed"]
        ),
        "rationale": types.Schema(type=types.Type.STRING),
    },
    required=["csat_1_5", "sentiment_score", "sentiment_label"]
)

SYSTEM_INSTRUCTION = (
    "You analyze customer service call transcripts. "
    "Return structured JSON with: "
    "1) csat_1_5: integer 1 (very dissatisfied) to 5 (very satisfied) "
    "based on how the customer would likely rate the interaction overall. "
    "2) sentiment_score: a continuous polarity in [-1.0, 1.0] where "
    "-1.0 = very negative, 0 = neutral, 1.0 = very positive. "
    "3) sentiment_label: one of {positive, neutral, negative, mixed}. "
    "If emotions are contradictory across the call, use 'mixed'. "
    "Consider resolution outcome and agent tone, not just isolated phrases. "
    "Return JSON only—no extra text."
)

# Simple client-side rate limiter
_last_call_ts = 0.0
_min_interval = 60.0 / max(1, RPM)

def _pace():
    global _last_call_ts
    now = time.time()
    wait_s = _min_interval - (now - _last_call_ts)
    if wait_s > 0:
        time.sleep(wait_s)
    _last_call_ts = time.time()

@retry(
    stop=stop_after_attempt(5),
    wait=wait_exponential_jitter(initial=1, max=20),
    reraise=True,
)
def analyze_transcript(transcript: str) -> Dict[str, Any]:
    """Call Gemini with structured JSON output for one transcript."""
    _pace()

    # We use JSON mode with response schema to enforce valid JSON output
    # Docs: https://ai.google.dev/api/generate-content
    #       https://ai.google.dev/gemini-api/docs/structured-output
    response = _client.models.generate_content(
        model=GEMINI_MODEL,
        contents=[
            types.Content(role="user", parts=[types.Part(text=SYSTEM_INSTRUCTION)]),
            types.Content(
                role="user",
                parts=[types.Part(text=f"TRANSCRIPT:\n{transcript}")]
            )
        ],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=_schema,
            temperature=0.2,  # keep it stable & consistent
        ),
    )

    # SDK returns text when in JSON mode that is JSON; client also exposes parsed candidates in some versions
    # We defensively parse via response.text
    import json
    raw = response.text or "{}"
    data = json.loads(raw)

    # Defensive normalization
    csat = int(round(float(data.get("csat_1_5", 3))))
    csat = max(1, min(5, csat))
    score = float(data.get("sentiment_score", 0.0))
    score = max(-1.0, min(1.0, score))
    label = str(data.get("sentiment_label", "neutral")).lower()
    if label not in {"positive", "neutral", "negative", "mixed"}:
        label = "neutral"

    return {
        "csat_1_5": csat,
        "sentiment_score": score,
        "sentiment_label": label,
        "rationale": data.get("rationale", "")
    }
