from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import shutil
import os
from typing import List, Optional

# Import local modules
from preprocessing import preprocess_image
from ocr_engine import get_ocr_engine
from normalization import get_normalization_engine
from llm_engine import get_llm_engine
from openfda import get_safety_checker
from translation_engine import get_translation_engine

app = FastAPI(
    title="ArogyaLens API",
    description="Backend API for ArogyaLens: Prescription & Medical Document Decoder",
    version="1.0.0"
)

# CORS Middleware for React Native Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# --- Data Models ---
class Medicine(BaseModel):
    name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None

class OCRResponse(BaseModel):
    medicines: List[Medicine]
    raw_text: str

class ExplanationRequest(BaseModel):
    medicines: List[Medicine]
    target_lang: str = "en"  # e.g., 'hi' for Hindi, 'te' for Telugu

class ExplanationResponse(BaseModel):
    simple_explanation: str
    warnings: Optional[str] = None
    audio_url: Optional[str] = None

# --- Directories Setup ---
UPLOAD_DIR = "uploads"
AUDIO_DIR = "audio_outputs"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(AUDIO_DIR, exist_ok=True)

# Serve audio files statically
app.mount("/audio", StaticFiles(directory=AUDIO_DIR), name="audio")


# --- Endpoints ---
@app.get("/")
def read_root():
    return {"message": "Welcome to ArogyaLens Backend API"}

@app.post("/upload/")
async def upload_document(file: UploadFile = File(...)):
    """
    Endpoint to receive document images (prescriptions, lab reports, medicine strips).
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File provided is not an image.")

    file_location = f"{UPLOAD_DIR}/{file.filename}"
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)

    # TODO: In a real flow, you might immediately trigger the OCR pipeline here.
    return {"info": f"file '{file.filename}' saved at '{file_location}'"}

@app.post("/process/ocr", response_model=OCRResponse)
async def process_ocr(image_path: str):
    """
    Triggers the OCR engine (TrOCR) on the uploaded image.
    1. Preprocesses the image using OpenCV.
    2. Runs TrOCR to extract text.
    """
    if not os.path.exists(image_path):
        raise HTTPException(status_code=404, detail="Image not found.")

    try:
        # Step 1: Preprocess Image (Deskew, Binarize, etc.)
        processed_path = preprocess_image(image_path)
        
        # Step 2: Extract Text using TrOCR
        engine = get_ocr_engine()
        raw_text = engine.extract_text(processed_path)
        
        # Step 3: Normalize Text (Decode abbreviations, Fuzzy Match)
        norm_engine = get_normalization_engine()
        structured_medicines = norm_engine.normalize_text(raw_text)
        
        # Fallback if normalization yields nothing
        if not structured_medicines and raw_text:
            structured_medicines = [{"name": "Unknown", "dosage": "N/A", "frequency": "N/A"}]

        return {
            "medicines": structured_medicines,
            "raw_text": raw_text
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/process/explain", response_model=ExplanationResponse)
async def process_explain(request: ExplanationRequest):
    """
    Takes extracted medicines, fetches drug info (OpenFDA), checks interactions,
    uses LLM (Mistral) to generate an explanation, translates it, and generates audio.
    """
    try:
        # Step 1: Check OpenFDA for Interactions
        names = [med.name for med in request.medicines if med.name.lower() != "unknown"]
        safety_checker = get_safety_checker()
        warnings = safety_checker.check_interactions(names)
        
        # Step 2: Generate simple explanation using Mistral (Ollama)
        llm = get_llm_engine()
        meds_dict = [{"name": m.name, "dosage": m.dosage, "frequency": m.frequency} for m in request.medicines]
        explanation = llm.generate_explanation(meds_dict)
        
        # Step 3: Translate and Generate Audio
        trans_engine = get_translation_engine()
        
        # Translate explanation
        if request.target_lang != "en":
            explanation = trans_engine.translate_text(explanation, request.target_lang)
            if warnings != "No dangerous interactions found between these medicines.":
                 warnings = trans_engine.translate_text(warnings, request.target_lang)
        
        # Generate audio filename
        # A unique filename could be generated here, using a hash or UUID. 
        # For simplicity, we use a static one for the demo.
        audio_filename = f"explanation_{request.target_lang}.mp3"
        audio_path = trans_engine.generate_audio(explanation, lang_code=request.target_lang, filename=audio_filename)
        
        audio_url = f"/audio/{audio_filename}" if audio_path else None
        
        return {
            "simple_explanation": explanation,
            "warnings": warnings,
            "audio_url": audio_url
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
