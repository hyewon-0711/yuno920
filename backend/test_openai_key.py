"""Simple OPENAI_API_KEY test script"""
import os
import sys
from pathlib import Path

# UTF-8 for Windows console
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

# backend/.env load
env_path = Path(__file__).parent / ".env"
if env_path.exists():
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))

key = os.environ.get("OPENAI_API_KEY", "")

if not key:
    print("[FAIL] OPENAI_API_KEY is not set.")
    print("       Add OPENAI_API_KEY=sk-... to backend/.env")
    exit(1)

if not key.startswith("sk-"):
    print("[WARN] API key format may be wrong (usually starts with sk-)")
    print(f"       Length: {len(key)} chars")

print("[OK] Key found. Calling OpenAI API...")

try:
    from openai import OpenAI
    client = OpenAI(api_key=key)
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": "Say hello in exactly 3 words."}],
        max_tokens=10,
    )
    reply = resp.choices[0].message.content
    print(f"[PASS] OpenAI response: {reply}")
except Exception as e:
    err = str(e).lower()
    if "invalid" in err or "api_key" in err or "401" in err or "authentication" in err:
        print(f"[FAIL] Invalid API key: {e}")
    else:
        print(f"[ERROR] {e}")
    exit(1)
