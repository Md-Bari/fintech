from pydantic import BaseModel
from typing import Optional


class LoanApplication(BaseModel):
    age: int = 30
    income: float = 25000
    loan_amount: float = 100000
    loan_term: int = 12
    credit_score: int = 650
    employment_status: str = "Self-employed"
    marital_status: str = "Married"
    education: str = "Secondary"
    property_area: str = "Urban"
    dependents: Optional[int] = 0
    purpose: Optional[str] = None
    description: Optional[str] = None


class ExplainRequest(BaseModel):
    fraud_rate: float
    amount: Optional[float] = 0
    duration_months: Optional[int] = 0
    purpose: Optional[str] = None
    description: Optional[str] = None
    product_name: Optional[str] = None
