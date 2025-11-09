from typing import Dict, Any

def clamp_and_label(row: Dict[str, Any]) -> Dict[str, Any]:
    """
    Final guardrails (just in case):
      - clamp csat to [1,5]
      - clamp score to [-1,1]
      - if label conflicts wildly with score, nudge to match score threshold
    """
    csat = int(max(1, min(5, int(row.get("csat_1_5", 3)))))
    score = float(max(-1.0, min(1.0, float(row.get("sentiment_score", 0.0)))))
    label = str(row.get("sentiment_label", "neutral")).lower()

    # Heuristic reconciliation
    if label not in {"positive", "neutral", "negative", "mixed"}:
        label = "neutral"
    if score >= 0.35 and label in {"negative", "neutral"}:
        label = "positive"
    elif score <= -0.35 and label in {"positive", "neutral"}:
        label = "negative"
    elif -0.15 < score < 0.15:
        label = "neutral"

    return {
        "csat_1_5": csat,
        "sentiment_score": score,
        "sentiment_label": label,
    }
