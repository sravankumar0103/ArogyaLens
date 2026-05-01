import csv
import re
from rapidfuzz import process, fuzz
import os
from typing import List, Dict, Any

class NormalizationEngine:
    def __init__(self, db_path: str = "../data/medicines.csv"):
        """
        Initializes the normalization engine with abbreviation rules
        and loads the medicine database for fuzzy matching.
        """
        self.abbreviations = {
            # Dosage forms
            "tab": "Tablet",
            "cap": "Capsule",
            "syr": "Syrup",
            "inj": "Injection",
            "drop": "Drops",
            
            # Frequencies (Rural-Friendly translations)
            "1-0-1": "Morning and Night",
            "1-1-1": "Morning, Afternoon, and Night",
            "0-0-1": "Night only",
            "1-0-0": "Morning only",
            "od": "Once a day",
            "bd": "Twice a day",
            "bid": "Twice a day",
            "tds": "Three times a day",
            "tid": "Three times a day",
            "qid": "Four times a day",
            "sos": "As needed (when required)",
            
            # Timings
            "pc": "After food",
            "ac": "Before food",
            "hs": "At bedtime"
        }
        
        self.medicines_db = []
        self._load_database(db_path)

    def _load_database(self, db_path: str):
        # Resolve path relative to this file to avoid working directory issues
        base_dir = os.path.dirname(os.path.abspath(__file__))
        full_path = os.path.join(base_dir, db_path)
        
        if not os.path.exists(full_path):
            print(f"Warning: Medicine DB not found at {full_path}. Fuzzy matching will be limited.")
            return
            
        with open(full_path, mode='r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                self.medicines_db.append(row)
        
        self.medicine_names = [med["Brand Name"].lower() for med in self.medicines_db] + \
                              [med["Generic Name"].lower() for med in self.medicines_db]

    def fuzzy_match_medicine(self, extracted_word: str, threshold: int = 75) -> str:
        """
        Uses RapidFuzz to correct misspelled medicine names.
        """
        if not self.medicine_names:
            return extracted_word
            
        # Extract best match
        match = process.extractOne(extracted_word.lower(), self.medicine_names, scorer=fuzz.WRatio)
        if match and match[1] >= threshold:
            return match[0].title()  # Return properly capitalized match
        return extracted_word

    def normalize_text(self, raw_text: str) -> List[Dict[str, Any]]:
        """
        Parses the raw OCR text and structures it into medicines, dosages, and instructions.
        Note: This is a basic rule-based parser. In advanced phases, LLM can handle this directly.
        """
        structured_data = []
        
        # Split by newlines or commas (assuming each line/segment is a prescription entry)
        lines = re.split(r'\n|,', raw_text.lower())
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            entry = {"name": "", "dosage": "N/A", "frequency": "N/A"}
            
            # Tokenize line
            words = line.split()
            cleaned_words = []
            
            for word in words:
                clean_word = re.sub(r'[^a-zA-Z0-9-]', '', word) # Remove punctuation for matching
                
                # Check for Frequency/Shorthand
                if clean_word in self.abbreviations:
                    if re.match(r'\d-\d-\d', clean_word) or clean_word in ["od", "bd", "bid", "tds", "tid", "qid", "sos"]:
                        entry["frequency"] = self.abbreviations[clean_word]
                    else:
                        cleaned_words.append(self.abbreviations[clean_word])
                        
                # Check for Dosage (e.g. 500mg, 10ml)
                elif re.search(r'\d+(mg|ml|mcg|g)', clean_word):
                    entry["dosage"] = clean_word
                else:
                    cleaned_words.append(clean_word)
            
            # The remaining words are likely the medicine name or form
            # Let's run the longest word or combination through fuzzy match
            if cleaned_words:
                # Find the longest word to fuzzy match (basic heuristic for brand name)
                longest_word = max(cleaned_words, key=len)
                if len(longest_word) > 3: # Ignore tiny words like 'and', 'for'
                    matched_name = self.fuzzy_match_medicine(longest_word)
                    entry["name"] = matched_name
                else:
                    entry["name"] = " ".join(cleaned_words).title()
            
            # Only add if a name was found
            if entry["name"]:
                structured_data.append(entry)
                
        return structured_data

# Singleton instance
_normalization_engine_instance = None

def get_normalization_engine():
    global _normalization_engine_instance
    if _normalization_engine_instance is None:
        _normalization_engine_instance = NormalizationEngine()
    return _normalization_engine_instance

if __name__ == "__main__":
    # Test script
    engine = get_normalization_engine()
    test_text = "Tab paracetmol 500mg 1-0-1\ncap amokxicillin 250mg tds\nsyr ascxril 10ml sos"
    print("Raw Text:\n", test_text)
    print("\nNormalized Data:")
    print(engine.normalize_text(test_text))
