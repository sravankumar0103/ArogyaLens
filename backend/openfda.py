import requests
from typing import List, Optional

class MedicalSafetyChecker:
    def __init__(self):
        self.base_url = "https://api.fda.gov/drug/label.json"

    def check_interactions(self, medicine_names: List[str]) -> Optional[str]:
        """
        Queries the OpenFDA API to check if there are major interactions or warnings
        for the given list of medicines.
        """
        if len(medicine_names) < 2:
            return "No interactions to check. Only one medicine provided."

        warnings = []
        for i in range(len(medicine_names)):
            for j in range(i + 1, len(medicine_names)):
                med1 = medicine_names[i]
                med2 = medicine_names[j]
                
                # We do a basic search in the drug interactions section
                query = f'search=drug_interactions:"{med1}"+AND+drug_interactions:"{med2}"&limit=1'
                url = f"{self.base_url}?{query}"
                
                try:
                    response = requests.get(url, timeout=5)
                    if response.status_code == 200:
                        data = response.json()
                        if data.get("results"):
                            warnings.append(f"Caution: {med1} and {med2} might interact.")
                except Exception as e:
                    print(f"Error checking OpenFDA for {med1} and {med2}: {e}")
                    pass
        
        if warnings:
            return " ".join(warnings)
        return "No dangerous interactions found between these medicines."

# Singleton instance
_safety_checker_instance = None

def get_safety_checker():
    global _safety_checker_instance
    if _safety_checker_instance is None:
        _safety_checker_instance = MedicalSafetyChecker()
    return _safety_checker_instance

if __name__ == "__main__":
    # Test script
    checker = get_safety_checker()
    print("Checking Paracetamol and Ibuprofen:")
    print(checker.check_interactions(["Paracetamol", "Ibuprofen"]))
