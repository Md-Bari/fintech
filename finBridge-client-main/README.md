# finBridge 🌉

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen?style=for-the-badge)](https://fin-bridge-nine.vercel.app/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

**finBridge** is a premium, full-stack Microfinance Platform designed to bridge the gap between ambitious Entrepreneurs and Microfinance Institutions (MFIs) in Bangladesh. This repository contains the front-end application, built with a focus on high-performance, responsive design, and intuitive role-based user experiences.

---

## 🚀 [Explore the Live Application](https://fin-bridge-nine.vercel.app/)

---

## 🌟 Key Features & Portals

finBridge provides a unified ecosystem with three distinct, role-optimized dashboards:

### 1. 💼 Entrepreneurs (Borrowers)
*   **Dynamic Marketplace:** Discover and filter loan products from verified MFIs based on interest rates, tenure, and amounts.
*   **Real-time Tracking:** Monitor the lifecycle of loan applications (Pending → Reviewing → Approved/Rejected).
*   **Visual Analytics:** Personalized charts (using Recharts) mapping historical loan requests and trajectories.
*   **Secure Document Vault:** Upload and manage identity documents (NID/TIN) securely.

### 2. 🏛️ Microfinance Institutions (MFI Admins)
*   **Digital Pipeline:** A fluid, modal-based workflow to manage incoming applications.
*   **Deep Applicant Review:** Secure access to borrower profiles and digital documents.
*   **Product Management:** Create, update, and toggle the active status of micro-loan offerings.
*   **Subscription & Billing:** Integrated tier-based membership with printable invoices and automated payment tracking.

### 3. 🛡️ Platform Administrators (Super Admin)
*   **Global Pulse:** High-level overview of platform health, including user growth, active MFIs, and total disbursed capital.
*   **Advanced Analytics:** Scale analysis via interactive visualizations (Bar, Pie, and Area charts).
*   **MFI Ledger:** Comprehensive management of institutional onboarding and status.

---

## 💻 Bleeding-Edge Tech Stack

*   **Framework:** [Next.js 15+](https://nextjs.org/) (App Router & Server Components)
*   **Library:** [React 19](https://react.dev/)
*   **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) (Atomic CSS with refined HSL design system)
*   **Components:** [shadcn/ui](https://ui.shadcn.com/) (Radix UI Primitives)
*   **Animations:** [Framer Motion](https://www.framer.com/motion/) (Smooth, scroll-triggered micro-interactions)
*   **State Management:** [Zustand](https://zustand-demo.pmnd.rs/) (Persisted global auth and app state)
*   **Data Visualization:** [Recharts](https://recharts.org/)
*   **Form Logic:** [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)

---

## 📁 Project Architecture

```bash
finBridge-client/
├── app/                  # Next.js App Router (Public & Role-based routes)
│   ├── (public)/         # Landing, Marketplace, Auth
│   ├── admin/            # Super Admin Secure Dashboard
│   ├── mfi/              # MFI Management Portal
│   └── entrepreneur/     # Borrower Analytics & Tracking
├── components/           # UI Component Library
│   ├── ui/               # shadcn/ui generic primitives
│   ├── home/             # Redesigned Landing Page Sections
│   └── shared/           # Navbars, Sidebars, and Layouts
├── lib/                  # Utilities, API Interceptors, and Helpers
├── store/                # Zustand State Stores
└── public/               # Optimized Static Assets
```

---

## 🔐 Security & Authentication

*   **JWT-Powered:** Secure authentication flow using JSON Web Tokens.
*   **RBAC:** Strict Role-Based Access Control enforced at both front-end (middleware) and back-end layers.
*   **Secure Interceptors:** Centralized Axios instance with automated Bearer token attachment and 401 handling.

---

## 🛠 Getting Started

### Prerequisites
*   Node.js v20+
*   Backend API running ([finBridge API](https://github.com/Sabuj-Chowdhury/finBridge-api))

### Setup
1. **Clone & Install:**
   ```bash
   git clone https://github.com/betopia-btrp/finBridge-client.git
   cd finBridge-client
   npm install
   ```

2. **Environment Configuration:**
   Create `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:9000/api/v1
   ```

3. **Run Dev:**
   ```bash
   npm run dev
   ```

---

## 📄 License

This project is proprietary and confidential.

*Built with passion for financial inclusion and economic empowerment in Bangladesh.*
