# Fraud Pattern Pipeline

This folder contains a concrete fraud-feature and scoring pipeline for your current schema.

## Assumption

`account type = users.role`

If you later add another account-type field (for example, `users.account_type`), update the SQL accordingly.

## Files

- `fraud_feature_queries.sql`: Feature extraction query from `loan_applications`, `users`, `loan_products`, and `application_documents`.
- `fraud_pipeline.py`: Train-and-score script that:
  - reads features from PostgreSQL,
  - trains a supervised model when `loan_applications.is_fraud` has both classes,
  - falls back to heuristic scoring if labels are missing/unbalanced,
  - writes scores back to `loan_applications.fraud_score` and `loan_applications.is_fraud`.

## Install

```bash
pip install pandas numpy scikit-learn sqlalchemy psycopg2-binary python-dotenv
```

## Run

From `finBridge-api-main`:

```bash
python analytics/fraud_pipeline.py
```

## Output

- Console metrics (`ROC-AUC`, precision/recall report) when supervised training is possible.
- Updated columns in DB:
  - `loan_applications.fraud_score` (0-100)
  - `loan_applications.is_fraud` (`true` if score >= 70%)

