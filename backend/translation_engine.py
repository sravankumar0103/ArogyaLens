import os
from gtts import gTTS
from typing import Optional
from googletrans import Translator

class TranslationAudioEngine:
    def __init__(self, output_dir: str = "audio_outputs"):
        """
        Initializes the Translation and Audio engine.
        Using googletrans for free language translation and gTTS for voice.
        """
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)
        self.translator = Translator()

    def translate_text(self, text: str, target_lang: str = "hi") -> str:
        """
        Translates the given English text to the target language.
        Supported target_lang codes: 'hi' (Hindi), 'te' (Telugu), 'en' (English).
        """
        if target_lang == "en":
            return text
            
        try:
            translation = self.translator.translate(text, dest=target_lang)
            return translation.text
        except Exception as e:
            print(f"Translation error: {e}")
            return text # Fallback to original text

    def generate_audio(self, text: str, lang_code: str = "en", filename: str = "output.mp3") -> Optional[str]:
        """
        Generates an MP3 file from the text using Google Text-to-Speech (gTTS).
        """
        try:
            tts = gTTS(text=text, lang=lang_code, slow=False)
            filepath = os.path.join(self.output_dir, filename)
            tts.save(filepath)
            return filepath
        except Exception as e:
            print(f"Audio generation error: {e}")
            return None

# Singleton instance
_translation_engine_instance = None

def get_translation_engine():
    global _translation_engine_instance
    if _translation_engine_instance is None:
        _translation_engine_instance = TranslationAudioEngine()
    return _translation_engine_instance

if __name__ == "__main__":
    # Test script
    engine = get_translation_engine()
    sample_text = "Take this medicine after food."
    
    # Test translation
    hi_text = engine.translate_text(sample_text, "hi")
    print(f"English: {sample_text}")
    print(f"Hindi: {hi_text}")
    
    # Test audio
    path = engine.generate_audio(hi_text, lang_code="hi", filename="test_hindi.mp3")
    print(f"Saved audio to: {path}")
