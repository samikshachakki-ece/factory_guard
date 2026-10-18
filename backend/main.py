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

FRONTEND_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "FRONTEND_ORIGINS",
        "http://127.0.0.1:8080,http://localhost:8080,http://127.0.0.1:5500,http://localhost:5500",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Configuration & Variables
AMD_API_KEY = os.getenv("AMD_API_KEY")
LLM_API_ENDPOINT = os.getenv("LLM_API_ENDPOINT", "http://localhost:8000/v1")
MODEL_PATH = os.getenv("MODEL_PATH", "models/sensor_anomaly_model.pkl")
SAMPLE_TIMESTAMP = "2026-10-17T08:45:00Z"

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


MACHINE_READINGS = [
    {"id": "M-001", "name": "CNC Mill #01", "line": "Line A", "status": "Healthy", "temperature": 42.6, "vibration": 2.1, "pressure": 6.4, "uptime": 99.2, "checked": "Just now", "type": "CNC machine", "efficiency": 96},
    {"id": "M-002", "name": "CNC Mill #02", "line": "Line A", "status": "Warning", "temperature": 75.8, "vibration": 5.8, "pressure": 6.7, "uptime": 96.4, "checked": "Just now", "type": "CNC machine", "efficiency": 84},
    {"id": "M-003", "name": "Hydraulic Press #04", "line": "Line B", "status": "Critical", "temperature": 92.1, "vibration": 6.6, "pressure": 8.3, "uptime": 91.8, "checked": "Just now", "type": "Hydraulic press", "efficiency": 72},
    {"id": "M-004", "name": "Conveyor Belt #02", "line": "Line B", "status": "Healthy", "temperature": 38.1, "vibration": 1.7, "pressure": 5.9, "uptime": 99.7, "checked": "Just now", "type": "Conveyor", "efficiency": 94},
    {"id": "M-005", "name": "Packaging Unit #01", "line": "Line C", "status": "Healthy", "temperature": 40.2, "vibration": 2.3, "pressure": 6.1, "uptime": 98.9, "checked": "Just now", "type": "Packaging", "efficiency": 93},
    {"id": "M-006", "name": "Cooling Pump #03", "line": "Line C", "status": "Warning", "temperature": 68.4, "vibration": 5.2, "pressure": 4.2, "uptime": 87.1, "checked": "Just now", "type": "Pump", "efficiency": 78},
    {"id": "M-007", "name": "CNC Mill #03", "line": "Line A", "status": "Healthy", "temperature": 43.1, "vibration": 2.4, "pressure": 6.5, "uptime": 98.8, "checked": "Just now", "type": "CNC machine", "efficiency": 95},
    {"id": "M-008", "name": "Assembly Robot #02", "line": "Line B", "status": "Healthy", "temperature": 46.5, "vibration": 2.0, "pressure": 6.2, "uptime": 99.4, "checked": "Just now", "type": "Robot", "efficiency": 97},
    {"id": "M-009", "name": "Air Compressor #01", "line": "Line C", "status": "Warning", "temperature": 77.4, "vibration": 4.9, "pressure": 8.1, "uptime": 95.2, "checked": "Just now", "type": "Compressor", "efficiency": 81},
    {"id": "M-010", "name": "Packaging Unit #02", "line": "Line C", "status": "Healthy", "temperature": 39.8, "vibration": 1.9, "pressure": 6.0, "uptime": 99.1, "checked": "Just now", "type": "Packaging", "efficiency": 92},
    {"id": "M-011", "name": "Conveyor Belt #04", "line": "Line B", "status": "Healthy", "temperature": 37.6, "vibration": 1.6, "pressure": 5.8, "uptime": 99.8, "checked": "Just now", "type": "Conveyor", "efficiency": 96},
    {"id": "M-012", "name": "Hydraulic Press #02", "line": "Line A", "status": "Healthy", "temperature": 48.2, "vibration": 2.8, "pressure": 7.5, "uptime": 98.1, "checked": "Just now", "type": "Hydraulic press", "efficiency": 90},
]


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


@app.get("/machines")
def list_machines():
    """Return clearly identified sample readings until a sensor adapter is configured."""
    return [
        {
            **machine,
            "updated_at": SAMPLE_TIMESTAMP,
            "data_source": "demo",
        }
        for machine in MACHINE_READINGS
    ]


@app.get("/alerts")
def list_alerts():
    """Return open alerts for machines reporting Warning or Critical status."""
    active_alerts = []
    for machine in MACHINE_READINGS:
        if machine["status"] not in {"Warning", "Critical"}:
            continue

        severity = machine["status"]
        active_alerts.append(
            {
                "id": len(active_alerts) + 1,
                "severity": severity,
                "title": f"{severity} condition detected on {machine['name']}",
                "description": (
                    f"{machine['name']} is reporting {machine['temperature']:.1f} °C, "
                    f"{machine['vibration']:.1f} mm/s vibration, and "
                    f"{machine['pressure']:.1f} bar pressure."
                ),
                "machineId": machine["id"],
                "timestamp": SAMPLE_TIMESTAMP,
                "state": "Open",
                "data_source": "demo",
            }
        )

    return active_alerts


@app.post("/predict-anomaly")
def predict_anomaly(sensor_data: SensorDataRequest):
    """Handles ML model predictions safely without crashing if model is missing."""
    if ml_model is None:
        return {
            "status": "UNKNOWN",
            "risk_score": None,
            "note": "Model not loaded; no anomaly prediction was made.",
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
        sensor_status = "UNKNOWN"
        if ml_model is not None:
            sensor_status = "NORMAL"
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
            "model_note": (
                "ML model not loaded; sensor status is unknown."
                if ml_model is None
                else None
            ),
            "guidance": llm_guidance,
            "system_overall": (
                "CRITICAL"
                if obj_status == "ISOLATE"
                else "UNKNOWN"
                if sensor_status == "UNKNOWN"
                else "CRITICAL"
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
        # Machine-health analysis endpoint
# Initial rule-based baseline; not a trained ML prediction.

class MachineAnalysisRequest(BaseModel):
    machine_id: str = Field(..., min_length=1)
    name: str = Field(..., min_length=1)
    temperature: float
    rpm: float | None = None
    torque: float | None = None
    wear: float | None = None
    vibration: float | None = None
    pressure: float | None = None


@app.post("/analyze")
def analyze_machine(request: MachineAnalysisRequest):
    """Analyze machine health using an initial rule-based baseline."""

    alerts = []

    # Critical conditions
    if request.temperature >= 90:
        alerts.append("Critical temperature")
    if request.wear is not None and request.wear >= 220:
        alerts.append("Critical wear level")

    if alerts:
        machine_status = "Critical"
        message = (
            f"{request.name} requires immediate inspection. "
            + ", ".join(alerts)
            + "."
        )

    # Warning conditions
    elif request.temperature >= 75 or (request.wear is not None and request.wear >= 170):
        machine_status = "Warning"
        reasons = []

        if request.temperature >= 75:
            reasons.append("elevated temperature")
        if request.wear is not None and request.wear >= 170:
            reasons.append("high wear level")

        message = (
            f"{request.name} needs attention due to "
            + " and ".join(reasons)
            + "."
        )

    else:
        machine_status = "Healthy"
        message = (
            f"{request.name} is within the initial "
            "temperature and wear thresholds."
            if request.wear is not None
            else "initial temperature thresholds."
        )

    return {
        "machine_id": request.machine_id,
        "machine_name": request.name,
        "status": machine_status,
        "message": message,
        "metrics": {
            "temperature": request.temperature,
            "rpm": request.rpm,
            "torque": request.torque,
            "wear": request.wear,
            "vibration": request.vibration,
            "pressure": request.pressure,
        },
        "analysis_method": "rule_based_baseline",
    }