import os
from google import genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
print(f"Key starts with: {api_key[:10]}...")

client = genai.Client(api_key=api_key)
try:
    for m in client.models.list():
        print(f"Model: {m.name}")
except Exception as e:
    print(f"Error: {e}")
