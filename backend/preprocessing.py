import cv2
import numpy as np
from PIL import Image
import os

def preprocess_image(image_path: str, output_path: str = None) -> str:
    """
    Preprocesses an image for better OCR results.
    Applies grayscale, noise removal, and adaptive thresholding.
    """
    # 1. Read image
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Could not read image from {image_path}")

    # 2. Convert to Grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # 3. Noise Removal (Blur)
    # Using Gaussian Blur to reduce high frequency noise
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)

    # 4. Binarization / Contrast Enhancement
    # Adaptive thresholding works best for uneven lighting (common in mobile photos)
    thresh = cv2.adaptiveThreshold(
        blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
    )

    # 5. Deskewing (Basic approach)
    # Find all non-zero points (text)
    coords = np.column_stack(np.where(thresh > 0))
    angle = cv2.minAreaRect(coords)[-1]
    
    # Correct angle
    if angle < -45:
        angle = -(90 + angle)
    else:
        angle = -angle

    # Rotate the image to deskew
    (h, w) = img.shape[:2]
    center = (w // 2, h // 2)
    M = cv2.getRotationMatrix2D(center, angle, 1.0)
    rotated = cv2.warpAffine(thresh, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)

    # Determine output path
    if not output_path:
        base, ext = os.path.splitext(image_path)
        output_path = f"{base}_preprocessed{ext}"

    # Save and return the preprocessed image path
    cv2.imwrite(output_path, rotated)
    return output_path

if __name__ == "__main__":
    # Test block
    print("Preprocessing module ready.")
