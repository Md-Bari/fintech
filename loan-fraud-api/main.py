from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.staticfiles import StaticFiles
import pandas as pd
import joblib
from pathlib import Path
import os
import json
import re
import shutil
import sqlite3
import uuid
from datetime import datetime, timezone
from urllib import request as urlrequest
from PIL import Image, ImageOps
import pytesseract
import imagehash
from PIL import ImageFilter
from schemas import LoanApplication, ExplainRequest, FinanceChatRequest

app = FastAPI(title="Loan Fraud Detection API")

BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR / "models"
STORED_NIDS_DIR = BASE_DIR / "stored_nids"
UPLOADS_DIR = BASE_DIR / "uploads"
NID_DB_PATH = BASE_DIR / "nid_kyc.db"
STORED_NIDS_DIR.mkdir(parents=True, exist_ok=True)
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
PUBLIC_BASE_URL = os.getenv("FRAUD_API_PUBLIC_BASE", "http://localhost:8000").rstrip("/")
app.mount("/files/stored_nids", StaticFiles(directory=str(STORED_NIDS_DIR)), name="stored_nids_files")
app.mount("/files/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="upload_files")


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


def _db_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(NID_DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_nid_db() -> None:
    with _db_conn() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS nid_references (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_unique_id TEXT NOT NULL,
                nid_number TEXT NOT NULL,
                image_path TEXT NOT NULL,
                image_hash TEXT,
                extracted_name TEXT,
                created_at TEXT NOT NULL
            )
            """
        )
        conn.execute("CREATE INDEX IF NOT EXISTS idx_nid_references_nid ON nid_references(nid_number)")


init_nid_db()


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _normalize_nid(value: str | None) -> str:
    if not value:
        return ""
    bn_to_en = str.maketrans("০১২৩৪৫৬৭৮৯", "0123456789")
    value = value.translate(bn_to_en)
    return re.sub(r"\D", "", value)


def _extract_nid_number(text: str) -> str:
    raw_text = text or ""
    normalized_text = raw_text.translate(str.maketrans("০১২৩৪৫৬৭৮৯", "0123456789"))
    # 1) Strong preference: NID-labeled region
    labeled = re.search(
        r"(?:NID|ID)\s*(?:NO|NUMBER|NUM)?\s*[:\-]?\s*([0-9OIlSBG\s]{8,24})",
        normalized_text,
        flags=re.IGNORECASE,
    )
    if labeled:
        candidate = labeled.group(1)
        # common OCR confusions for digit fields
        candidate = (
            candidate.replace("O", "0")
            .replace("o", "0")
            .replace("I", "1")
            .replace("l", "1")
            .replace("S", "5")
            .replace("B", "8")
            .replace("G", "6")
        )
        digits = _normalize_nid(candidate)
        if len(digits) in (10, 13, 16, 17):
            return digits

    # 2) Score all long digit groups by context proximity to NID keywords
    candidates: list[tuple[int, str]] = []
    for m in re.finditer(r"[0-9][0-9\s]{8,24}", normalized_text):
        raw_candidate = m.group(0)
        digits = _normalize_nid(raw_candidate)
        if len(digits) not in (10, 13, 16, 17):
            continue

        start = max(0, m.start() - 25)
        end = min(len(normalized_text), m.end() + 25)
        ctx = normalized_text[start:end].lower()
        score = 0
        if "nid" in ctx or "id no" in ctx or "national id" in ctx:
            score += 20
        # prefer common Bangladesh formats
        if len(digits) == 10:
            score += 6
        elif len(digits) == 13:
            score += 5
        elif len(digits) == 17:
            score += 4
        else:
            score += 3
        # right-most values on card are often NID
        score += int((m.start() / max(1, len(normalized_text))) * 5)
        candidates.append((score, digits))

    if candidates:
        candidates.sort(key=lambda x: x[0], reverse=True)
        return candidates[0][1]

    compact = re.sub(r"\s+", "", _normalize_nid(normalized_text) or "")
    for pattern in (r"\d{10}", r"\d{13}", r"\d{17}", r"\d{16}"):
        m = re.search(pattern, compact)
        if m:
            return m.group(0)
    return ""


def _extract_name(text: str) -> str:
    lines = [ln.strip() for ln in (text or "").splitlines() if ln.strip()]
    for line in lines:
        m = re.search(r"\bName\s*[:\-]\s*(.+)$", line, flags=re.IGNORECASE)
        if m:
            return m.group(1).strip(" .,-")
    for i, line in enumerate(lines):
        if re.fullmatch(r"Name\.?", line, flags=re.IGNORECASE) and i + 1 < len(lines):
            candidate = lines[i + 1].strip(" .,-")
            if re.fullmatch(r"[A-Za-z .'-]{4,80}", candidate):
                return candidate
    for line in lines:
        if re.fullmatch(r"[A-Za-z .'-]{4,80}", line):
            return line
    return ""


def _ocr_text(image_path: Path) -> str:
    with Image.open(image_path) as img:
        # Multiple preprocess variants for blur, low contrast, compression artifacts.
        variants = []
        gray = ImageOps.grayscale(img).convert("L")
        up2 = gray.resize((gray.width * 2, gray.height * 2), Image.Resampling.LANCZOS)
        sharp = up2.filter(ImageFilter.SHARPEN)

        variants.append(up2)
        variants.append(ImageOps.autocontrast(up2))
        variants.append(ImageOps.equalize(up2))
        variants.append(ImageOps.invert(up2))
        variants.append(ImageOps.autocontrast(sharp))

        # Fixed threshold variants
        variants.append(up2.point(lambda p: 255 if p > 120 else 0, mode="1").convert("L"))
        variants.append(up2.point(lambda p: 255 if p > 145 else 0, mode="1").convert("L"))

        best_text = ""
        best_score = -1
        configs = [
            "--oem 3 --psm 6",
            "--oem 3 --psm 11",
            "--oem 3 --psm 4",
        ]

        for variant in variants:
            for cfg in configs:
                try:
                    text = pytesseract.image_to_string(variant, lang="eng", config=cfg).strip()
                except Exception:
                    continue

                digits_count = len(_normalize_nid(text))
                has_nid_word = 1 if re.search(r"\b(?:nid|id\s*no|national)\b", text, flags=re.IGNORECASE) else 0
                score = (digits_count * 2) + len(text) + (has_nid_word * 15)
                if score > best_score:
                    best_score = score
                    best_text = text

        return best_text


def _phash(image_path: Path) -> str:
    with Image.open(image_path) as img:
        return str(imagehash.phash(img))


def _image_hashes(image_path: Path) -> dict[str, str]:
    with Image.open(image_path) as img:
        return {
            "phash": str(imagehash.phash(img)),
            "dhash": str(imagehash.dhash(img)),
            "whash": str(imagehash.whash(img)),
        }


def _similarity_from_hex(hash_a: str, hash_b: str) -> float:
    a = imagehash.hex_to_hash(hash_a)
    b = imagehash.hex_to_hash(hash_b)
    return max(0.0, (1.0 - ((a - b) / 64.0)) * 100.0)


def _similarity_from_hash_sets(upload_hashes: dict[str, str], ref_hashes: dict[str, str]) -> float:
    scores: list[float] = []
    for key in ("phash", "dhash", "whash"):
        if upload_hashes.get(key) and ref_hashes.get(key):
            scores.append(_similarity_from_hex(upload_hashes[key], ref_hashes[key]))
    if not scores:
        return 0.0
    # Weighted toward best score for robustness against compression/crop noise.
    best = max(scores)
    avg = sum(scores) / len(scores)
    return round((best * 0.7) + (avg * 0.3), 2)


def _best_reference_visual_match(upload_path: Path) -> dict | None:
    candidates: list[Path] = []
    for ext in (".jpg", ".jpeg", ".png", ".webp", ".bmp"):
        candidates.extend(STORED_NIDS_DIR.glob(f"*{ext}"))

    if not candidates:
        return None

    upload_hashes = _image_hashes(upload_path)
    best_score = -1.0
    best_ref: Path | None = None

    for candidate in candidates:
        try:
            ref_hashes = _image_hashes(candidate)
            score = _similarity_from_hash_sets(upload_hashes, ref_hashes)
            if score > best_score:
                best_score = score
                best_ref = candidate
        except Exception:
            continue

    if best_ref is None:
        return None

    # Extract any NID-like digits from filename if present.
    guessed_nid = _normalize_nid(best_ref.stem)
    return {
        "image_path": str(best_ref),
        "nid_number": guessed_nid or None,
        "similarity_score": round(best_score, 2),
    }


def _find_reference_by_nid(nid_number: str) -> dict | None:
    with _db_conn() as conn:
        row = conn.execute(
            """
            SELECT customer_unique_id, nid_number, image_path, image_hash, extracted_name
            FROM nid_references
            WHERE nid_number = ?
            ORDER BY id DESC
            LIMIT 1
            """,
            (nid_number,),
        ).fetchone()
        if row:
            return dict(row)

    # fallback by filename if db row absent
    for ext in (".jpg", ".jpeg", ".png", ".webp", ".bmp"):
        p = STORED_NIDS_DIR / f"{nid_number}{ext}"
        if p.exists():
            return {
                "customer_unique_id": "",
                "nid_number": nid_number,
                "image_path": str(p),
                "image_hash": None,
                "extracted_name": "",
            }
    return None


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


def _is_finance_message(message: str) -> bool:
    text = (message or "").lower()
    finance_keywords = [
        "loan", "emi", "interest", "finance", "financial", "credit", "repay", "installment",
        "debt", "amount", "income", "budget", "bank", "mfi", "borrowing", "tenure", "package",
    ]
    return any(k in text for k in finance_keywords)


def finance_chat_response(message: str, packages: list[dict], history: list[dict]) -> str:
    if not _is_finance_message(message):
        return "I can only help with financial topics, loan guidance, repayment planning, and choosing suitable loan packages."

    packages = packages[:20]
    compact_packages = []
    for p in packages:
        compact_packages.append({
            "name": p.get("name"),
            "mfi_name": p.get("mfi_name"),
            "min_amount": p.get("min_amount"),
            "max_amount": p.get("max_amount"),
            "interest_rate": p.get("interest_rate"),
            "duration_months": p.get("duration_months"),
            "id": p.get("id"),
        })

    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        if compact_packages:
            top = compact_packages[:3]
            suggestions = ", ".join([f"{x.get('name')} ({x.get('mfi_name')})" for x in top])
            return f"Based on available packages, consider: {suggestions}. Tell me your desired amount and tenure to refine suggestions."
        return "Share your desired amount, income, and loan duration, and I will suggest suitable loan packages."

    history_text = "\n".join(
        [f"{(h.get('role') or 'user')}: {str(h.get('content') or '')[:250]}" for h in (history or [])[-8:]]
    )
    prompt = (
        "You are FinBridge Financial Agent, a professional loan advisor.\n"
        "Strict policy:\n"
        "1) Respond only to finance, loans, EMI, repayment planning, eligibility, and budgeting.\n"
        "2) If user asks non-finance questions, refuse briefly and redirect to finance.\n"
        "3) If amount or duration is missing, ask only one focused follow-up question.\n"
        "4) When recommending, mention 2-3 best matching packages from provided list by exact name.\n"
        "5) Keep answer practical, clear, and under 140 words.\n"
        "6) Never invent package names not in provided list.\n\n"
        f"Available packages JSON:\n{json.dumps(compact_packages, ensure_ascii=False)}\n\n"
        f"Recent chat:\n{history_text}\n\n"
        f"User message: {message}\n"
    )

    model_candidates = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]
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

    return "I can help with loan amount planning, tenure selection, and package comparison. Please share your target amount and repayment duration."


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


@app.post("/chat/financial-assistant")
def financial_assistant(payload: FinanceChatRequest):
    reply = finance_chat_response(payload.message, payload.packages or [], payload.history or [])
    return {"reply": reply}


@app.post("/nid/register-reference")
async def register_reference_nid(
    customer_unique_id: str = Form(...),
    file: UploadFile = File(...),
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are supported")

    ext = Path(file.filename or "").suffix or ".jpg"
    temp_path = UPLOADS_DIR / f"ref_{uuid.uuid4().hex}{ext}"
    with temp_path.open("wb") as out:
        shutil.copyfileobj(file.file, out)

    text = _ocr_text(temp_path)
    nid_number = _normalize_nid(_extract_nid_number(text))
    extracted_name = _extract_name(text)
    if not nid_number:
        temp_path.unlink(missing_ok=True)
        raise HTTPException(status_code=422, detail="NID number not found from OCR")

    final_path = STORED_NIDS_DIR / f"{nid_number}.jpg"
    shutil.copyfile(temp_path, final_path)
    temp_path.unlink(missing_ok=True)
    ref_hash = _phash(final_path)

    with _db_conn() as conn:
        conn.execute(
            """
            INSERT INTO nid_references(customer_unique_id, nid_number, image_path, image_hash, extracted_name, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (customer_unique_id, nid_number, str(final_path), ref_hash, extracted_name, _utc_now()),
        )

    return {
        "success": True,
        "customer_unique_id": customer_unique_id,
        "nid_number": nid_number,
        "extracted_name": extracted_name,
        "stored_image_path": str(final_path),
        "stored_image_url": f"{PUBLIC_BASE_URL}/files/stored_nids/{final_path.name}",
    }


@app.post("/nid/verify-upload")
async def verify_uploaded_nid(
    customer_unique_id: str = Form(...),
    file: UploadFile = File(...),
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are supported")

    ext = Path(file.filename or "").suffix or ".jpg"
    upload_path = UPLOADS_DIR / f"upload_{uuid.uuid4().hex}{ext}"
    with upload_path.open("wb") as out:
        shutil.copyfileobj(file.file, out)

    text = _ocr_text(upload_path)
    nid_number = _normalize_nid(_extract_nid_number(text))
    extracted_name = _extract_name(text)
    if not nid_number:
        return {
            "success": False,
            "customer_unique_id": customer_unique_id,
            "message": "NID number not found in OCR text",
            "matched": False,
            "similarity_score": 0.0,
            "nid_number": None,
            "extracted_name": extracted_name or None,
            "raw_text": text,
            "uploaded_image_path": str(upload_path),
            "uploaded_image_url": f"{PUBLIC_BASE_URL}/files/uploads/{upload_path.name}",
        }

    reference = _find_reference_by_nid(nid_number)
    if not reference:
        fallback = _best_reference_visual_match(upload_path)
        if fallback and fallback["similarity_score"] >= 70.0:
            ref_path = Path(fallback["image_path"])
            return {
                "success": True,
                "customer_unique_id": customer_unique_id,
                "message": "Matched by visual fallback from stored_nids",
                "matched": True,
                "similarity_score": float(fallback["similarity_score"]),
                "nid_number": nid_number or fallback.get("nid_number"),
                "extracted_name": extracted_name or None,
                "reference_found": True,
                "reference_image_path": str(ref_path),
                "reference_image_url": f"{PUBLIC_BASE_URL}/files/stored_nids/{ref_path.name}",
                "uploaded_image_path": str(upload_path),
                "uploaded_image_url": f"{PUBLIC_BASE_URL}/files/uploads/{upload_path.name}",
                "raw_text": text,
            }
        return {
            "success": True,
            "customer_unique_id": customer_unique_id,
            "message": "Reference image not found for extracted NID",
            "matched": False,
            "similarity_score": 0.0,
            "nid_number": nid_number,
            "extracted_name": extracted_name or None,
            "reference_found": False,
            "raw_text": text,
            "uploaded_image_path": str(upload_path),
            "uploaded_image_url": f"{PUBLIC_BASE_URL}/files/uploads/{upload_path.name}",
        }

    ref_path = Path(reference["image_path"])
    if not ref_path.exists():
        return {
            "success": True,
            "customer_unique_id": customer_unique_id,
            "message": "Reference path missing on disk",
            "matched": False,
            "similarity_score": 0.0,
            "nid_number": nid_number,
            "extracted_name": extracted_name or None,
            "reference_found": False,
            "raw_text": text,
            "uploaded_image_path": str(upload_path),
            "uploaded_image_url": f"{PUBLIC_BASE_URL}/files/uploads/{upload_path.name}",
        }

    upload_hashes = _image_hashes(upload_path)
    ref_hashes = _image_hashes(ref_path)
    similarity = _similarity_from_hash_sets(upload_hashes, ref_hashes)
    matched = similarity >= 55.0

    if not matched:
        fallback = _best_reference_visual_match(upload_path)
        if fallback and fallback["similarity_score"] >= similarity:
            similarity = float(fallback["similarity_score"])
            if similarity >= 70.0:
                matched = True
                ref_path = Path(fallback["image_path"])
                if not nid_number and fallback.get("nid_number"):
                    nid_number = str(fallback["nid_number"])

    return {
        "success": True,
        "customer_unique_id": customer_unique_id,
        "nid_number": nid_number,
        "extracted_name": extracted_name or None,
        "matched": matched,
        "similarity_score": similarity,
        "reference_found": True,
        "reference_image_path": str(ref_path),
        "reference_image_url": f"{PUBLIC_BASE_URL}/files/stored_nids/{ref_path.name}",
        "uploaded_image_path": str(upload_path),
        "uploaded_image_url": f"{PUBLIC_BASE_URL}/files/uploads/{upload_path.name}",
        "raw_text": text,
    }
