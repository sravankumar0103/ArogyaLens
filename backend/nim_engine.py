import base64
import os
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI


BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

client = OpenAI(
    base_url="https://integrate.api.nvidia.com/v1",
    api_key=os.getenv("NVAPI_KEY"),
)

VISION_MODELS = [
    "meta/llama-3.2-90b-vision-instruct",
    "meta/llama-3.2-11b-vision-instruct",
]


async def run_pipeline(content: bytes, prompt: str, mime_type: str = "image/jpeg") -> tuple[str, str]:
    if not os.getenv("NVAPI_KEY"):
        raise RuntimeError("NVAPI_KEY is not configured.")

    base64_image = base64.b64encode(content).decode("utf-8")
    errors: list[str] = []

    for model_name in VISION_MODELS:
        try:
            response = client.chat.completions.create(
                model=model_name,
                messages=[
                    {
                        "role": "system",
                        "content": "You are ArogyaLens. Follow the user instructions exactly and return only the final answer they ask for.",
                    },
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{base64_image}"}},
                        ],
                    },
                ],
                max_tokens=1600,
                temperature=0.2,
            )
            text = response.choices[0].message.content or ""
            if text.strip():
                return text, model_name
            errors.append(f"{model_name}: empty response")
        except Exception as exc:
            errors.append(f"{model_name}: {exc}")

    raise RuntimeError("; ".join(errors) or "No NVIDIA vision model returned a response.")
