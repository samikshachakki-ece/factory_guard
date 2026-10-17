import os
import logging
import joblib
import httpx
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# Load environment variables (.env file)
load_dotenv()

# Configure logging (hides sensitive internal errors from client responses)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("FactoryGuardBackend")

app = FastAPI(title="FactoryGuard AI")

# Allow CORS requests from frontend (Streamlit / Web)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8501",
        "http://127.0.0.1:8501",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# Configuration & Variables
AMD_API_KEY = os.getenv("AMD_API_KEY")
LLM_API_ENDPOINT = os.getenv("LLM_API_ENDPOINT", "http://localhost:8000/v1")
MODEL_PATH = os.getenv("MODEL_PATH", "models/sensor_anomaly_model.pkl")

# Safe ML Model Loading
ml_model = None
try:
    if os.path.exists(MODEL_PATH):
        ml_model = joblib.load(MODEL_PATH)
        logger.info(f"ML Model loaded successfully from {MODEL_PATH}")
    else:
        logger.warning(f"Model file not found at {MODEL_PATH}. Running in fallback mode.")
except Exception as e:
    logger.error(f"Failed to load ML Model: {str(e)}")


# Schemas
class SensorDataRequest(BaseModel):
    temperature: float = Field(..., description="Sensor temperature input")
    vibration: float = Field(..., description="Sensor vibration input")
    pressure: float = Field(..., description="Sensor pressure input")


class FullWorkflowRequest(BaseModel):
    object_type: str = Field(..., min_length=1)
    authorized: bool
    sensor_data: SensorDataRequest


# Endpoints
@app.get("/")
def home():
    return {"message": "FactoryGuard AI backend is running!"}


@app.get("/health")
def health():
    return {
        "status": "online",
        "model_loaded": ml_model is not None,
        "amd_config": bool(AMD_API_KEY),
    }


@app.post("/predict-anomaly")
def predict_anomaly(sensor_data: SensorDataRequest):
    """Handles ML model predictions safely without crashing if model is missing."""
    if ml_model is None:
        return {
            "status": "UNKNOWN",
            "risk_score": 0.0,
            "note": "Model not loaded, using safe baseline.",
        }

    try:
        features = [
            [
                sensor_data.temperature,
                sensor_data.vibration,
                sensor_data.pressure,
            ]
        ]
        prediction = ml_model.predict(features)[0]
        return {
            "status": "ANOMALY" if prediction == 1 else "NORMAL",
            "prediction": int(prediction),
        }
    except Exception as e:
        logger.error(f"Error during model prediction: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error processing sensor prediction.",
        )


@app.post("/workflow")
async def run_full_workflow(request: FullWorkflowRequest):
    """Full integrated workflow from dashboard inputs to final guidance."""
    try:
        # A. Authorization check
        obj_type = request.object_type.strip().lower()
        if request.authorized:
            obj_status = "NORMAL"
        elif obj_type in ["wildlife", "unknown_person"]:
            obj_status = "ISOLATE"
        else:
            obj_status = "WARNING"

        # B. Sensor Anomaly ML Model Check
        sensor_status = "NORMAL"
        if ml_model is not None:
            features = [
                [
                    request.sensor_data.temperature,
                    request.sensor_data.vibration,
                    request.sensor_data.pressure,
                ]
            ]
            pred = ml_model.predict(features)[0]
            if pred == 1:
                sensor_status = "ANOMALY_DETECTED"

        # C. AMD / LLM API Integration with Graceful Fallback
        llm_guidance = "Standard monitoring recommended."
        if AMD_API_KEY:
            try:
                async with httpx.AsyncClient(timeout=5.0) as client:
                    response = await client.post(
                        f"{LLM_API_ENDPOINT}/chat",
                        headers={"Authorization": f"Bearer {AMD_API_KEY}"},
                        json={
                            "prompt": f"Status: {obj_status}, Sensor: {sensor_status}. Suggest response."
                        },
                    )
                    if response.status_code == 200:
                        llm_guidance = response.json().get(
                            "guidance", llm_guidance
                        )
            except Exception as api_err:
                logger.warning(
                    f"AMD Cloud API offline or timed out: {str(api_err)}"
                )
                llm_guidance = (
                    "RAG service offline. Follow standard operating protocol."
                )

        return {
            "object_status": obj_status,
            "sensor_status": sensor_status,
            "guidance": llm_guidance,
            "system_overall": (
                "CRITICAL"
                if "ISOLATE" in [obj_status, sensor_status]
                else "STABLE"
            ),
        }

    except Exception as e:
        logger.error(f"Workflow execution error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during workflow execution.",
        )