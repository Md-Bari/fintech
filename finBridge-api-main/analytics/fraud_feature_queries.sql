-- Fraud feature extraction for FinBridge (PostgreSQL)
-- Assumption: "account type" is users.role (entrepreneur, mfi_admin, platform_admin).

WITH app_docs AS (
    SELECT
        ad.loan_application_id,
        COUNT(*) AS doc_count,
        COUNT(*) FILTER (WHERE ad.type = 'nid') AS nid_count,
        COUNT(*) FILTER (WHERE ad.type = 'tax') AS tax_count,
        COUNT(*) FILTER (WHERE ad.type = 'tin') AS tin_count,
        COUNT(DISTINCT ad.file_path) AS distinct_doc_paths
    FROM application_documents ad
    GROUP BY ad.loan_application_id
),
user_apps AS (
    SELECT
        la.user_id,
        COUNT(*) AS user_total_apps,
        COUNT(*) FILTER (WHERE la.status = 'approved') AS user_approved_apps,
        COUNT(*) FILTER (WHERE la.status = 'rejected') AS user_rejected_apps,
        COUNT(*) FILTER (
            WHERE COALESCE(la.applied_at, la.created_at) >= NOW() - INTERVAL '7 days'
        ) AS user_apps_last_7d,
        COUNT(*) FILTER (
            WHERE COALESCE(la.applied_at, la.created_at) >= NOW() - INTERVAL '30 days'
        ) AS user_apps_last_30d
    FROM loan_applications la
    GROUP BY la.user_id
),
mfi_apps AS (
    SELECT
        la.mfi_id,
        COUNT(*) AS mfi_total_apps,
        COUNT(*) FILTER (WHERE la.status = 'approved') AS mfi_approved_apps,
        COUNT(*) FILTER (WHERE la.status = 'rejected') AS mfi_rejected_apps,
        COUNT(*) FILTER (
            WHERE COALESCE(la.applied_at, la.created_at) >= NOW() - INTERVAL '30 days'
        ) AS mfi_apps_last_30d
    FROM loan_applications la
    GROUP BY la.mfi_id
),
base AS (
    SELECT
        la.id AS application_id,
        la.user_id,
        la.mfi_id,
        la.loan_product_id,
        COALESCE(la.applied_at, la.created_at) AS applied_ts,
        la.status,
        la.amount,
        la.duration_months,
        COALESCE(la.monthly_income, 0) AS monthly_income,
        COALESCE(la.fraud_score, 0) AS existing_fraud_score,
        COALESCE(la.is_fraud, false) AS is_fraud_label,
        COALESCE(la.purpose, '') AS purpose,
        u.role AS account_type,
        u.phone,
        lp.min_amount,
        lp.max_amount,
        lp.interest_rate,
        lp.processing_fee,
        EXTRACT(HOUR FROM COALESCE(la.applied_at, la.created_at)) AS applied_hour,
        EXTRACT(DOW FROM COALESCE(la.applied_at, la.created_at)) AS applied_dow
    FROM loan_applications la
    JOIN users u ON u.id = la.user_id
    JOIN loan_products lp ON lp.id = la.loan_product_id
)
SELECT
    b.application_id,
    b.user_id,
    b.mfi_id,
    b.loan_product_id,
    b.applied_ts,
    b.status,
    b.account_type,
    b.amount,
    b.duration_months,
    b.monthly_income,
    b.existing_fraud_score,
    b.is_fraud_label,
    b.interest_rate,
    b.processing_fee,
    b.min_amount,
    b.max_amount,
    b.applied_hour,
    b.applied_dow,
    LENGTH(TRIM(b.purpose)) AS purpose_length,
    CASE
        WHEN b.monthly_income > 0 THEN ROUND((b.amount / b.monthly_income)::numeric, 4)
        ELSE NULL
    END AS loan_to_income_ratio,
    CASE
        WHEN b.min_amount IS NOT NULL AND b.amount < b.min_amount THEN 1 ELSE 0
    END AS below_product_min_flag,
    CASE
        WHEN b.max_amount IS NOT NULL AND b.amount > b.max_amount THEN 1 ELSE 0
    END AS above_product_max_flag,
    COALESCE(d.doc_count, 0) AS doc_count,
    COALESCE(d.nid_count, 0) AS nid_count,
    COALESCE(d.tax_count, 0) AS tax_count,
    COALESCE(d.tin_count, 0) AS tin_count,
    COALESCE(d.distinct_doc_paths, 0) AS distinct_doc_paths,
    COALESCE(ua.user_total_apps, 0) AS user_total_apps,
    COALESCE(ua.user_approved_apps, 0) AS user_approved_apps,
    COALESCE(ua.user_rejected_apps, 0) AS user_rejected_apps,
    COALESCE(ua.user_apps_last_7d, 0) AS user_apps_last_7d,
    COALESCE(ua.user_apps_last_30d, 0) AS user_apps_last_30d,
    COALESCE(ma.mfi_total_apps, 0) AS mfi_total_apps,
    COALESCE(ma.mfi_approved_apps, 0) AS mfi_approved_apps,
    COALESCE(ma.mfi_rejected_apps, 0) AS mfi_rejected_apps,
    COALESCE(ma.mfi_apps_last_30d, 0) AS mfi_apps_last_30d
FROM base b
LEFT JOIN app_docs d ON d.loan_application_id = b.application_id
LEFT JOIN user_apps ua ON ua.user_id = b.user_id
LEFT JOIN mfi_apps ma ON ma.mfi_id = b.mfi_id;

