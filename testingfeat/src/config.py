import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
# local pacing guard; server-side quotas/limits still apply
RPM = int(os.getenv("RPM", "60"))

if not GEMINI_API_KEY:
    raise RuntimeError(
        "GEMINI_API_KEY not set. Create one in Google AI Studio and put it in .env"
    )
