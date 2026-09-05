# 🌉 FinBridge — Digital Microfinance Platform

## 📌 Project Overview

**FinBridge** is a full-stack digital microfinance platform designed to connect **entrepreneurs** with **Microfinance Institutions (MFIs)** through a centralized, secure, and user-friendly financial ecosystem.

The platform aims to simplify the complete microfinance lifecycle — from discovering loan products and submitting applications to reviewing applications, managing loan products, processing subscriptions, and monitoring financial activities.

FinBridge is particularly designed with the **Bangladeshi microfinance ecosystem** in mind, providing separate role-based experiences for Entrepreneurs, MFI Administrators, and Platform Administrators.

---

## 🎯 Main Objectives

The primary objectives of FinBridge are to:

* Connect entrepreneurs with suitable Microfinance Institutions.
* Provide entrepreneurs with a digital platform to discover and apply for loans.
* Allow MFIs to create and manage loan products.
* Digitize the loan application and approval workflow.
* Provide secure role-based access to different platform users.
* Enable subscription and payment management for MFIs.
* Provide dashboards and analytics for monitoring platform activities.
* Introduce AI-based capabilities for improving loan and fraud assessment.
* Improve financial accessibility and support financial inclusion.

---

## 👥 User Roles

FinBridge provides three major user roles:

### 💼 1. Entrepreneur

Entrepreneurs are borrowers who can use the platform to find and apply for suitable loan products.

Key capabilities include:

* Browse available loan products.
* Filter loan products based on amount, interest rate, and duration.
* Submit loan applications.
* Upload required documents such as NID/TIN.
* Track loan application status.
* View application history.
* Monitor financial and loan-related analytics.

The loan application lifecycle can follow stages such as:

`Pending → Reviewing → Approved / Rejected`

---

### 🏦 2. MFI Administrator

MFI administrators manage their institution and its loan operations.

Key capabilities include:

* Create and manage loan products.
* Define loan amount limits.
* Configure interest rates.
* Define loan durations.
* View incoming loan applications.
* Review applicant information and documents.
* Approve or reject loan applications.
* Manage MFI subscriptions.
* View payment history.
* Generate and access invoices.
* Monitor MFI-level analytics.

---

### 🛡️ 3. Platform Administrator

The Platform Administrator has system-wide management capabilities.

Key capabilities include:

* Monitor overall platform performance.
* Manage MFIs.
* Monitor entrepreneurs and applications.
* View platform-wide financial statistics.
* Monitor revenue and subscription information.
* Manage subscription plans.
* View analytical reports.
* Monitor total disbursed capital and platform growth.

---

## 🏗️ System Architecture

FinBridge consists of multiple major components:

```text
                    ┌─────────────────────────┐
                    │       FinBridge         │
                    │     Web Application     │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │      RESTful API        │
                    │   Laravel Backend       │
                    └────────────┬────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
              ▼                  ▼                  ▼
        ┌───────────┐      ┌───────────┐      ┌────────────┐
        │PostgreSQL │      │   Redis   │      │ SSLCommerz │
        │ Database  │      │  Caching  │      │  Payment   │
        └───────────┘      └───────────┘      └────────────┘
                                 
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │   Loan Fraud / AI API   │
                    │     Python Service      │
                    └─────────────────────────┘
```

The repository contains separate components for the frontend, backend API, infrastructure configuration, and loan-fraud service.

---

## 💻 Technology Stack

### Frontend

* **Next.js 15+**
* **React 19**
* **TypeScript**
* **Tailwind CSS v4**
* **shadcn/ui**
* **Framer Motion**
* **Zustand**
* **Recharts**
* **React Hook Form**
* **Zod**

The frontend uses Next.js App Router and provides separate interfaces for Entrepreneurs, MFIs, and Platform Administrators.

### Backend

* **Laravel 13.x**
* **PHP 8.3+**
* **PostgreSQL**
* **Laravel Sanctum**
* **Redis / Predis**
* **SSLCommerz**
* **Pest PHP**

The backend exposes RESTful APIs for authentication, subscriptions, payments, loan management, applications, and administrative operations.

### AI / Fraud Detection

The project also contains a dedicated **loan-fraud API** service implemented as a separate Python-based component. It contains model-related resources and an API application for loan-fraud functionality.

### DevOps / Infrastructure

* Docker
* Docker Compose
* PostgreSQL
* Redis
* pgAdmin
* Environment-based configuration

---

## 🔐 Security

Security is an important part of the platform.

FinBridge implements:

* Token-based authentication.
* Role-Based Access Control (RBAC).
* Protected dashboards.
* API authentication.
* Bearer-token authorization.
* Centralized API request handling.
* Protected access to borrower documents.
* Role-specific permissions.

Both the frontend and backend enforce role-based access restrictions.

---

## 💰 Payment & Subscription Management

FinBridge includes a subscription and payment management system for MFIs.

The platform supports:

* Subscription plans.
* Subscription activation.
* Online payment initiation.
* Payment history.
* Invoice generation.
* Subscription status tracking.
* Subscription-based feature limitations.

The backend integrates **SSLCommerz** for payment processing.

---

## 🏦 Loan Management

Loan management is one of the core functionalities of FinBridge.

### Loan Product Creation

MFIs can create loan products with information such as:

* Loan name
* Maximum loan amount
* Interest rate
* Loan duration
* Description
* Active/inactive status

### Loan Application

Entrepreneurs can:

1. Browse loan products.
2. Select a suitable MFI and loan product.
3. Submit an application.
4. Provide requested financial information.
5. Upload identification documents.
6. Track application progress.

### Application Review

MFI administrators can:

* View submitted applications.
* Search and filter applications.
* Review applicant information.
* Examine uploaded documents.
* Approve applications.
* Reject applications.

---

## 🤖 AI & Fraud Detection

FinBridge includes a dedicated **Loan Fraud API** as part of its architecture.

The purpose of this component is to support intelligent analysis of loan applications and potentially identify suspicious or fraudulent applications.

This creates an opportunity for the platform to incorporate:

* Automated fraud detection.
* Risk assessment.
* Document analysis.
* Applicant verification.
* Loan-risk scoring.
* AI-assisted decision support.

The repository currently separates this functionality into the `loan-fraud-api` component.

---

## 📊 Analytics & Dashboards

The platform provides analytics for different stakeholders.

### Entrepreneur Dashboard

Provides insights into:

* Loan applications.
* Application history.
* Loan status.
* Financial activity.

### MFI Dashboard

Provides information about:

* Loan applications.
* Loan products.
* Applicant pipeline.
* Subscription.
* Payments.
* MFI performance.

### Platform Admin Dashboard

Provides global statistics such as:

* User growth.
* Active MFIs.
* Revenue.
* Loan applications.
* Disbursed capital.
* Platform performance.

Interactive charts are implemented using **Recharts** on the frontend.

---

## 📁 Repository Structure

```text
fintech/
│
├── finBridge-api-main/
│   └── Laravel REST API
│
├── finBridge-client-main/
│   └── Next.js Frontend
│
├── loan-fraud-api/
│   └── Python-based Loan Fraud Service
│
├── docker/
│   └── Infrastructure configuration
│
├── .github/
│   └── GitHub Actions / workflows
│
└── docker-compose.yml
```

The main repository currently contains these major application components along with Docker and GitHub workflow configuration.

---

## 🔄 Typical System Workflow

```text
Entrepreneur
     │
     ▼
Create Account
     │
     ▼
Browse Loan Products
     │
     ▼
Select MFI & Loan Product
     │
     ▼
Submit Loan Application
     │
     ▼
Document / Risk / Fraud Assessment
     │
     ▼
MFI Reviews Application
     │
     ├───────────────┐
     ▼               ▼
  Approve          Reject
     │
     ▼
Loan Processing
```

---

## 🌐 Frontend

The FinBridge frontend is a modern responsive web application with separate dashboards for:

* Entrepreneurs
* MFI Administrators
* Platform Administrators

It uses Next.js, React, Tailwind CSS, shadcn/ui, Zustand, and Recharts to provide a modern user experience.

---

## 🚀 Backend API

The backend is implemented using Laravel and provides APIs for:

* Authentication
* Entrepreneur registration
* MFI registration
* Login/logout
* Loan products
* Loan applications
* MFI management
* Subscriptions
* Payments
* Invoices
* Administrative dashboards
* Revenue reports

The API uses PostgreSQL as its primary database and Laravel Sanctum for authentication.

---

## 🐳 Deployment

The project includes Docker and Docker Compose configuration to support containerized deployment.

The architecture can be deployed as multiple services:

```text
Frontend
   │
   ├── Next.js
   │
   ▼
Backend API
   │
   ├── Laravel
   │
   ├── PostgreSQL
   │
   ├── Redis
   │
   └── Payment Gateway
   │
   ▼
Loan Fraud API
   │
   └── AI / ML Models
```

---

## 🎯 Target Users

FinBridge is designed primarily for:

* Entrepreneurs
* Microfinance Institutions
* Financial service providers
* Platform administrators
* Small businesses
* Micro-business owners
* Organizations supporting financial inclusion

---

## 🌱 Vision

The long-term vision of FinBridge is to create a **digital financial bridge between entrepreneurs and financial institutions**, reducing the complexity of accessing microfinance services.

By combining:

**Digital Lending + Microfinance + Payment Processing + Analytics + AI/Fraud Detection**

FinBridge can evolve into a comprehensive digital financial ecosystem for underserved entrepreneurs.

---

## 📌 Project Status

FinBridge is an actively structured full-stack fintech project containing:

* Web frontend
* RESTful backend
* PostgreSQL database integration
* Authentication and RBAC
* Loan management
* Subscription management
* Payment integration
* Analytics dashboards
* Loan-fraud/AI service
* Docker-based infrastructure

---

## 📄 License

Please refer to the individual project components and repository configuration for licensing information.

---

## 🔗 Repository

**GitHub:**
https://github.com/Md-Bari/fintech

**Live Application:**
https://fin-bridge-nine.vercel.app/

---

## ⭐ Summary

> **FinBridge is a full-stack digital microfinance platform that connects entrepreneurs with Microfinance Institutions through a secure, role-based ecosystem for loan discovery, applications, loan management, subscriptions, payments, analytics, and AI-assisted fraud detection.**
