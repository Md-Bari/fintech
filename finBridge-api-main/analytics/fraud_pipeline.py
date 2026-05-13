import os
from pathlib import Path

import numpy as np
import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.metrics import classification_report, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.ensemble import RandomForestClassifier


ROOT = Path(__file__).resolve().parents[1]
ENV_PATH = ROOT / ".env"
SQL_PATH = Path(__file__).resolve().parent / "fraud_feature_queries.sql"


def build_engine():
    load_dotenv(ENV_PATH)
    db_host = os.getenv("DB_HOST", "127.0.0.1")
    db_port = os.getenv("DB_PORT", "5432")
    db_name = os.getenv("DB_DATABASE", "finbridgeapi")
    db_user = os.getenv("DB_USERNAME", "finbridgeapi_user")
    db_pass = os.getenv("DB_PASSWORD", "1234")

    url = f"postgresql+psycopg2://{db_user}:{db_pass}@{db_host}:{db_port}/{db_name}"
    return create_engine(url, pool_pre_ping=True)


def load_features(engine):
    sql = SQL_PATH.read_text(encoding="utf-8")
    return pd.read_sql(sql, engine)

def db_snapshot(engine):
    checks = {}
    with engine.begin() as conn:
        checks["current_database"] = conn.execute(text("SELECT current_database()")).scalar_one()
        checks["current_schema"] = conn.execute(text("SELECT current_schema()")).scalar_one()
        checks["search_path"] = conn.execute(text("SHOW search_path")).scalar_one()
        checks["loan_tables"] = conn.execute(
            text(
                """
                SELECT COALESCE(
                    string_agg(table_schema || '.' || table_name, ', ' ORDER BY table_schema, table_name),
                    ''
                )
                FROM information_schema.tables
                WHERE table_type = 'BASE TABLE'
                  AND table_name IN ('loan_applications', 'application_documents', 'users')
                """
            )
        ).scalar_one()
        checks["loan_applications"] = conn.execute(
            text("SELECT COUNT(*) FROM loan_applications")
        ).scalar_one()
        checks["public_loan_applications"] = conn.execute(
            text("SELECT COUNT(*) FROM public.loan_applications")
        ).scalar_one()
        checks["users"] = conn.execute(text("SELECT COUNT(*) FROM users")).scalar_one()
        checks["application_documents"] = conn.execute(
            text("SELECT COUNT(*) FROM application_documents")
        ).scalar_one()
    return checks


def build_model(numeric_cols, categorical_cols):
    num_pipe = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )
    cat_pipe = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("onehot", OneHotEncoder(handle_unknown="ignore")),
        ]
    )
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", num_pipe, numeric_cols),
            ("cat", cat_pipe, categorical_cols),
        ]
    )

    model = RandomForestClassifier(
        n_estimators=300,
        random_state=42,
        class_weight="balanced_subsample",
        min_samples_leaf=3,
        n_jobs=-1,
    )

    return Pipeline([("prep", preprocessor), ("model", model)])


def upsert_scores(engine, app_ids, probabilities):
    updates = [
        {"id": app_id, "score": float(prob * 100.0), "is_fraud": bool(prob >= 0.7)}
        for app_id, prob in zip(app_ids, probabilities)
    ]

    stmt = text(
        """
        UPDATE loan_applications
        SET fraud_score = :score,
            is_fraud = :is_fraud,
            updated_at = NOW()
        WHERE id = :id
        """
    )
    with engine.begin() as conn:
        conn.execute(stmt, updates)


def main():
    engine = build_engine()
    db_info = {
        "host": os.getenv("DB_HOST"),
        "port": os.getenv("DB_PORT"),
        "database": os.getenv("DB_DATABASE"),
        "username": os.getenv("DB_USERNAME"),
    }
    counts = db_snapshot(engine)
    print(f"DB target: {db_info}")
    print(f"Row counts: {counts}")

    df = load_features(engine)

    if df.empty:
        raise SystemExit(
            "No loan applications found from the active DB target. "
            "Run migrations/seeders on this DB or switch .env to the DB that has data."
        )

    # Use is_fraud labels when present. If labels are all one class, skip supervised training.
    y = df["is_fraud_label"].astype(int)

    drop_cols = {
        "application_id",
        "user_id",
        "mfi_id",
        "loan_product_id",
        "applied_ts",
        "status",
        "is_fraud_label",
    }
    X = df[[c for c in df.columns if c not in drop_cols]].copy()

    categorical_cols = [c for c in ["account_type"] if c in X.columns]
    numeric_cols = [c for c in X.columns if c not in categorical_cols]

    if y.nunique() < 2:
        print("Label has a single class. Running unsupervised fallback scoring.")
        # Fallback: simple weighted risk score from high-signal numeric features
        ratio = X.get("loan_to_income_ratio", pd.Series(np.nan, index=X.index)).fillna(0)
        recent_apps = X.get("user_apps_last_7d", pd.Series(0, index=X.index))
        above_max = X.get("above_product_max_flag", pd.Series(0, index=X.index))
        score = (
            (ratio.clip(0, 10) / 10.0) * 0.5
            + (recent_apps.clip(0, 10) / 10.0) * 0.3
            + above_max.clip(0, 1) * 0.2
        )
        score = score.clip(0, 1)
        upsert_scores(engine, df["application_id"], score.values)
        print("Fallback scores updated.")
        return

    X_train, X_test, y_train, y_test, id_train, id_test = train_test_split(
        X, y, df["application_id"], test_size=0.25, random_state=42, stratify=y
    )

    clf = build_model(numeric_cols, categorical_cols)
    clf.fit(X_train, y_train)

    test_probs = clf.predict_proba(X_test)[:, 1]
    test_pred = (test_probs >= 0.5).astype(int)

    print("ROC-AUC:", round(roc_auc_score(y_test, test_probs), 4))
    print(classification_report(y_test, test_pred, digits=4))

    # Score all applications and write back
    all_probs = clf.predict_proba(X)[:, 1]
    upsert_scores(engine, df["application_id"], all_probs)
    print("Fraud scores updated in loan_applications.fraud_score")


if __name__ == "__main__":
    main()
