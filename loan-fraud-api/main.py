from fastapi import FastAPI
import pandas as pd
import joblib
from pathlib import Path
import os
import json
from datetime import datetime, timezone
from urllib import request as urlrequest
from schemas import LoanApplication, ExplainRequest

app = FastAPI(title="Loan Fraud Detection API")

BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR / "models"


def resolve_model_path(default_name: str, pattern: str) -> Path:
    default_path = MODELS_DIR / default_name
    if default_path.exists():
        return default_path
    matches = sorted(MODELS_DIR.glob(pattern))
    if matches:
        return matches[0]
    raise FileNotFoundError(f"Missing model artifact: {default_name} / {pattern}")


MODEL_PATH = resolve_model_path("loan_fraud_detection_model.pkl", "loan_fraud_detection_model*.pkl")
PREPROCESSOR_PATH = resolve_model_path("preprocessor.pkl", "preprocessor*.pkl")

model = joblib.load(MODEL_PATH)
preprocessor = joblib.load(PREPROCESSOR_PATH)


def to_model_payload(application: LoanApplication) -> dict:
    now = datetime.now(timezone.utc)
    base = application.model_dump()

    payload = {
        "amount": float(base.get("loan_amount", 0)),
        "monthly_income": float(base.get("income", 0)),
        "duration_months": int(base.get("loan_term", 0)),
        "credit_score": int(base.get("credit_score", 0)),
        "employment_status": base.get("employment_status", "employed"),
        "marital_status": base.get("marital_status", "single"),
        "education": base.get("education", "secondary"),
        "property_area": base.get("property_area", "urban"),
        "dependents": int(base.get("dependents", 0)),
        "age": int(base.get("age", 30)),
        "purpose": base.get("purpose", "business"),
        "description": base.get("description", ""),
        "applied_at_year": now.year,
        "applied_at_month": now.month,
        "applied_at_day": now.day,
        "applied_at_hour": now.hour,
        "applied_at_dayofweek": now.weekday(),
        "created_at_year": now.year,
        "created_at_month": now.month,
        "created_at_day": now.day,
        "created_at_hour": now.hour,
        "created_at_dayofweek": now.weekday(),
        "updated_at_year": now.year,
        "updated_at_month": now.month,
        "updated_at_day": now.day,
        "updated_at_hour": now.hour,
        "updated_at_dayofweek": now.weekday(),
    }

    return payload


def get_risk_level(probability):
    if probability >= 70:
        return "High Risk"
    elif probability >= 40:
        return "Medium Risk"
    else:
        return "Low Risk"


def build_fallback_reason(application: LoanApplication, fraud_rate: float) -> str:
    reasons = []
    if application.loan_amount > (application.income * 8):
        reasons.append("Loan amount is very high compared to declared income")
    if application.credit_score < 600:
        reasons.append("Low credit score increases repayment uncertainty")
    if application.loan_term > 36:
        reasons.append("Long loan term raises default exposure")
    if application.employment_status.lower() in {"unemployed", "temporary"}:
        reasons.append("Unstable employment profile")
    if fraud_rate >= 70 and not reasons:
        reasons.append("Multiple model signals indicate elevated fraud risk")

    if not reasons:
        reasons.append("Model detected moderate inconsistency across profile features")

    return "; ".join(reasons) + "."


def _extract_gemini_text(data: dict) -> str:
    parts = (
        data.get("candidates", [{}])[0]
        .get("content", {})
        .get("parts", [])
    )
    if not isinstance(parts, list):
        return ""
    texts = [str(part.get("text", "")).strip() for part in parts if isinstance(part, dict)]
    return " ".join([t for t in texts if t]).strip()


def _list_available_models(api_key: str) -> list[str]:
    try:
        req = urlrequest.Request(
            url=f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}",
            headers={"Content-Type": "application/json"},
            method="GET",
        )
        with urlrequest.urlopen(req, timeout=6) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            models = []
            for model in data.get("models", []):
                name = str(model.get("name", ""))
                methods = model.get("supportedGenerationMethods", []) or []
                short = name.replace("models/", "")
                if short and "generateContent" in methods:
                    models.append(short)
            return models
    except Exception:
        return []


def _call_gemini(api_key: str, model_name: str, prompt: str) -> str:
    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.2, "maxOutputTokens": 120},
    }
    req = urlrequest.Request(
        url=f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent",
        data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json", "x-goog-api-key": api_key},
        method="POST",
    )
    with urlrequest.urlopen(req, timeout=8) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        return _extract_gemini_text(data)


def gemini_reason(application: LoanApplication, fraud_rate: float, risk_level: str) -> str:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        return build_fallback_reason(application, fraud_rate)

    prompt = (
        "You are a loan fraud analyst. Provide one short, plain-English reason for fraud risk "
        f"for this application. Fraud rate: {fraud_rate:.2f}%, risk: {risk_level}. "
        f"Input: {application.model_dump()}. Keep it under 35 words."
    )

    model_candidates = [
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-1.5-pro",
    ]
    discovered = _list_available_models(api_key)
    if discovered:
        preferred = [m for m in discovered if "flash" in m or "pro" in m]
        model_candidates = preferred[:5] if preferred else discovered[:5]

    for model_name in model_candidates:
        try:
            text = _call_gemini(api_key, model_name, prompt)
            if text:
                return text
        except Exception:
            continue

    return build_fallback_reason(application, fraud_rate)


def gemini_explanation_from_fields(payload: ExplainRequest) -> str:
    fraud_rate = max(0.0, min(100.0, float(payload.fraud_rate)))
    amount = float(payload.amount or 0)
    duration = int(payload.duration_months or 0)
    purpose = (payload.purpose or "").strip()
    description = (payload.description or "").strip()
    product = (payload.product_name or "").strip()
    risk_level = get_risk_level(fraud_rate)

    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if api_key:
        model_candidates = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]
        discovered = _list_available_models(api_key)
        if discovered:
            preferred = [m for m in discovered if "flash" in m or "pro" in m]
            model_candidates = preferred[:5] if preferred else discovered[:5]

        prompt = (
            "You are a financial fraud analyst. Return exactly one complete sentence between 22 and 35 words. "
            "Include risk percentage, amount signal, tenure signal, and one practical review concern. "
            "Do not use bullet points.\n"
            f"Inputs: risk={fraud_rate:.2f}%, level={risk_level}, amount={amount}, duration_months={duration}, "
            f"purpose={purpose or 'N/A'}, description={description or 'N/A'}, product={product or 'N/A'}."
        )

        for model_name in model_candidates:
            try:
                text = _call_gemini(api_key, model_name, prompt)
                if text and len(text.split()) >= 12 and text.endswith((".", "!", "?")):
                    return text
            except Exception:
                continue

    # Strong deterministic fallback when model is unavailable or returns low-quality text.
    amount_signal = "high requested amount" if amount >= 300000 else "moderate requested amount" if amount >= 150000 else "lower requested amount"
    tenure_signal = "long tenure exposure" if duration >= 30 else "medium tenure exposure" if duration >= 18 else "short tenure exposure"
    concern = "limited narrative clarity" if len(description) < 12 else "possible repayment-capacity mismatch"
    return (
        f"Fraud risk is {fraud_rate:.0f}%, driven by {amount_signal} and {tenure_signal}, so this application should receive manual verification for "
        f"{concern} before any approval decision."
    )


@app.get("/")
def home():
    return {"message": "Loan Fraud Detection API is running"}


@app.post("/predict")
def predict_fraud(application: LoanApplication):
    data = pd.DataFrame([to_model_payload(application)])

    processed_data = preprocessor.transform(data)

    fraud_probability = model.predict_proba(processed_data)[0][1] * 100
    prediction = model.predict(processed_data)[0]

    risk_level = get_risk_level(fraud_probability)
    reason = gemini_reason(application, fraud_probability, risk_level) if fraud_probability >= 40 else None

    return {
        "fraud_rate": round(fraud_probability, 2),
        "risk_level": risk_level,
        "prediction": "Fraud" if prediction == 1 else "Not Fraud",
        "admin_suggestion": f"This loan application has {round(fraud_probability, 2)}% fraud risk.",
        "fraud_reason": reason,
    }


@app.post("/predict-pending")
def predict_pending_applications(applications: list[LoanApplication]):
    results = []

    for index, app_data in enumerate(applications):
        data = pd.DataFrame([to_model_payload(app_data)])
        processed_data = preprocessor.transform(data)

        fraud_probability = model.predict_proba(processed_data)[0][1] * 100
        prediction = model.predict(processed_data)[0]

        risk_level = get_risk_level(fraud_probability)
        reason = gemini_reason(app_data, fraud_probability, risk_level) if fraud_probability >= 40 else None

        results.append({
            "application_no": index + 1,
            "fraud_rate": round(fraud_probability, 2),
            "risk_level": risk_level,
            "prediction": "Fraud" if prediction == 1 else "Not Fraud",
            "admin_suggestion": f"This application has {round(fraud_probability, 2)}% fraud risk.",
            "fraud_reason": reason,
        })

    return {
        "total_pending_applications": len(results),
        "results": results
    }


@app.post("/explain")
def explain_fraud(payload: ExplainRequest):
    reason = gemini_explanation_from_fields(payload)
    return {"fraud_reason": reason}
