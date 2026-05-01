from transformers import TrOCRProcessor, VisionEncoderDecoderModel
from PIL import Image
import torch

class MedicalOCREngine:
    def __init__(self):
        """
        Initializes the TrOCR model for handwriting recognition.
        We use the 'microsoft/trocr-base-handwritten' model as a starting point.
        """
        print("Loading TrOCR model. This might take a minute...")
        # Check if GPU is available
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        print(f"Using device: {self.device}")
        
        self.processor = TrOCRProcessor.from_pretrained('microsoft/trocr-base-handwritten')
        self.model = VisionEncoderDecoderModel.from_pretrained('microsoft/trocr-base-handwritten').to(self.device)
        print("TrOCR Model loaded successfully.")

    def extract_text(self, image_path: str) -> str:
        """
        Extracts handwritten or printed text from the given image path.
        """
        try:
            # Load the preprocessed image
            image = Image.open(image_path).convert("RGB")
            
            # Prepare image for the model
            pixel_values = self.processor(images=image, return_tensors="pt").pixel_values.to(self.device)
            
            # Generate text
            generated_ids = self.model.generate(pixel_values)
            generated_text = self.processor.batch_decode(generated_ids, skip_special_tokens=True)[0]
            
            return generated_text.strip()
        except Exception as e:
            print(f"Error during OCR extraction: {e}")
            return ""

# Singleton instance to be used across the app
# initialized as None to avoid loading on import if not needed immediately
_ocr_engine_instance = None

def get_ocr_engine():
    global _ocr_engine_instance
    if _ocr_engine_instance is None:
        _ocr_engine_instance = MedicalOCREngine()
    return _ocr_engine_instance

if __name__ == "__main__":
    # Test script
    engine = get_ocr_engine()
    print("Engine ready for testing.")
