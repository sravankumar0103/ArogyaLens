import requests
import json
from typing import List, Dict, Any

class LLMEngine:
    def __init__(self, ollama_url: str = "http://localhost:11434"):
        """
        Initializes the connection to the local Ollama instance.
        Ensure you have run `ollama run mistral` or similar locally.
        """
        self.ollama_url = ollama_url
        self.model = "mistral" # Defaulting to mistral 7b

    def generate_explanation(self, medicines: List[Dict[str, Any]]) -> str:
        """
        Generates a rural-friendly, extremely simple explanation of the medicines.
        """
        if not medicines:
            return "I could not find any recognizable medicines in this document."

        # Create a string representation of the medicines
        med_list_str = "\n".join([f"- {med['name']} (Dosage: {med.get('dosage', 'Unknown')}, Frequency: {med.get('frequency', 'Unknown')})" for med in medicines])
        
        prompt = f"""
You are ArogyaLens, an AI doctor assistant for rural patients with low literacy.
Your job is to explain the following medicines in the simplest terms possible.
DO NOT use medical jargon. Explain what it is for, and when to take it.
Keep it short and caring.

Medicines extracted from prescription:
{med_list_str}

Respond with exactly what the audio voice should say to the patient.
"""
        
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False
        }
        
        try:
            response = requests.post(f"{self.ollama_url}/api/generate", json=payload, timeout=2)
            if response.status_code == 200:
                data = response.json()
                return data.get("response", "I am sorry, I couldn't understand the medicines.")
            else:
                # Fallback to dynamic template if Mistral is not installed
                return self._generate_fallback(medicines)
        except requests.exceptions.RequestException as e:
            print(f"Error connecting to Ollama: {e}")
            return self._generate_fallback(medicines)

    def _generate_fallback(self, medicines: List[Dict[str, Any]]) -> str:
        names = [med['name'] for med in medicines if med['name'] != 'Unknown']
        if not names:
            return "Please consult your doctor. I could not clearly read the medicines from the image."
        
        text = f"You have {len(names)} medicine(s) to take. "
        for med in medicines:
            if med['name'] == 'Unknown': continue
            text += f"Take {med['name']} for your condition. "
            if med.get('frequency') and med['frequency'] != 'Unknown':
                text += f"The schedule is {med['frequency']}. "
        text += "Always follow your doctor's advice."
        return text

# Singleton instance
_llm_engine_instance = None

def get_llm_engine():
    global _llm_engine_instance
    if _llm_engine_instance is None:
        _llm_engine_instance = LLMEngine()
    return _llm_engine_instance

if __name__ == "__main__":
    # Test script
    engine = get_llm_engine()
    sample_meds = [
        {"name": "Paracetamol", "dosage": "500mg", "frequency": "Morning and Night"}
    ]
    print("Testing LLM generation (requires local Ollama running):")
    # print(engine.generate_explanation(sample_meds))
    print("Test skipped to avoid hanging if Ollama isn't running.")
