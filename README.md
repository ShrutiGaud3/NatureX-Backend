# NATUREX — Climate & Nature Impact Platform (Backend)

Node.js + TypeScript + MongoDB backend structured strictly according to the NATUREX MVP specification documents.

---

## 📁 Architecture & Folder Structure

Har module ek micro-service style structured module hai under `src/modules/`.
**Har single module ke andar STRICTLY yehi 5 files hain:**
1. `model.ts` — MongoDB / Mongoose Schema & Interfaces
2. `controller.ts` — Business logic & API endpoints handlers
3. `routes.ts` — Express router mapping
4. `validations.ts` — Request payload validations
5. `middleware.ts` — Role & ownership security gates

```
d:/NatureX-backend/
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
├── README.md
└── src/
    ├── config/
    │   └── db.ts
    ├── modules/
    │   ├── auth/                    (OTP, JWT token, Sessions)
    │   ├── users/                   (User Profiles, Status)
    │   ├── roles-permissions/       (RBAC Policies)
    │   ├── organizations/           (FPO/NGO/Project Developers)
    │   ├── kyc/                     (Farmer KYC & Approvals)
    │   ├── bank-payout-profile/     (Bank details & Masked Accounts)
    │   ├── lands/                   (Land Registry & Details)
    │   ├── gis/                     (GeoJSON Polygon & Area Calculation)
    │   ├── land-documents/          (Land Records & 7/12 Extracts)
    │   ├── projects/                (Project Lifecycle & Status Engine)
    │   ├── project-types/           (Carbon, Water Impact, Biodiversity)
    │   ├── project-questionnaires/  (Dynamic Questionnaires)
    │   ├── evidence/                (Geotagged Photos, Videos & Hashes)
    │   ├── field-visits/            (Field Agent Visits & Offline Sync)
    │   ├── field-tasks/             (Field Ops Tasks & Checklists)
    │   ├── mrv/                     (MRV Records & Cycle Measurements)
    │   ├── review/                  (Admin & Reviewer Findings)
    │   ├── verification/            (Third-Party ACVA Verification)
    │   ├── programs/                (Corporate Impact Programs)
    │   ├── benefits/                (Financial Benefit Ledger & Payouts)
    │   ├── notifications/           (Push, SMS & In-app Alerts)
    │   ├── support/                 (Support Tickets & Resolution)
    │   ├── reports/                 (KPI Summaries & Analytics)
    │   ├── audit/                   (Immutable Audit Trail)
    │   └── admin/                   (Super Admin Governance & Settings)
    ├── app.ts                       (Express app & route mounting)
    └── server.ts                    (Server entrypoint)
```

---

## 🚀 Setup & Run

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 3. Development Server
```bash
npm run dev
```

### 4. Production Build
```bash
npm run build
npm start
```

---

## 🩺 API Base Endpoints

- **Health Check**: `GET http://localhost:5000/api/v1/health`
- **Auth**: `/api/v1/auth`
- **Users**: `/api/v1/users`
- **Lands**: `/api/v1/lands`
- **GIS**: `/api/v1/gis`
- **Projects**: `/api/v1/projects`
- **Evidence**: `/api/v1/evidence`
- **MRV**: `/api/v1/mrv`
- **Field Visits**: `/api/v1/field-visits`
- **Benefits**: `/api/v1/benefits`
- **Admin**: `/api/v1/admin`
