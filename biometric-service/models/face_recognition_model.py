"""Placeholder face recognition model.

This is a minimal, safe stub so the rest of the application can import a model
object. Replace with a real model loader (face embeddings, ONNX/Torch/Keras, etc.)
when integrating an actual biometric model.
"""
from typing import Optional, Dict


class FaceRecognitionModel:
    def __init__(self, model_path: Optional[str] = None):
        self.model_path = model_path
        self.model = None

    def load(self) -> None:
        # Implement actual model loading here
        # e.g. load ONNX/TorchModel/Keras model and warm it up
        self.model = "stub-model-loaded"

    def predict(self, embedding) -> Dict[str, float]:
        # embedding -> returned label/confidence
        # This is a placeholder prediction.
        return {"label": "unknown", "confidence": 0.0}


_MODEL: Optional[FaceRecognitionModel] = None


def get_model(path: Optional[str] = None) -> FaceRecognitionModel:
    global _MODEL
    if _MODEL is None:
        _MODEL = FaceRecognitionModel(path)
        _MODEL.load()
    return _MODEL
