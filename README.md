<div align="center">

# 👥 PeopleFlow HR Suite

### Multi-Country HR & Payroll SaaS Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Drizzle](https://img.shields.io/badge/Drizzle-C5F74F?style=for-the-badge&logo=drizzle&logoColor=black)](https://orm.drizzle.team/)
[![Better-T-Stack](https://img.shields.io/badge/Better--T--Stack-FF6B6B?style=for-the-badge)](https://github.com/AmanVarshney01/create-better-t-stack)

[Features](#features) • [Quick Start](#quick-start) • [Architecture](#architecture) • [API Reference](#api-reference) • [Roadmap](#roadmap)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Target Users](#target-users)
- [The Problem](#the-problem)
- [Our Solution](#our-solution)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Roadmap](#roadmap)
- [Contributing](#contributing)

> **📚 Documentation**: See [STACK.md](./STACK.md) for comprehensive documentation links and latest API references for all technologies used in this project.

---

## 🎯 Overview

**PeopleFlow HR Suite** is a modern, multi-tenant HR and Payroll management system designed for businesses operating across multiple countries. Built on the Better-T-Stack, it provides end-to-end type safety, real-time analytics, and a flexible tax calculation engine that adapts to different jurisdictions.

## 👥 Target Users

| Segment | Company Size | Use Case |
|---------|-------------|----------|
| **SMB** | 10-100 employees | Single-country operations, basic payroll & HR |
| **Mid-Market** | 100-1000 employees | Multi-department structures, custom tax rules |
| **Enterprise HR** | 1000+ employees | Multi-country operations, complex compliance requirements |

---

## ❌ The Problem

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Traditional HR/Payroll systems are:                           │
│                                                                 │
│  ❌ Single-country focused                                      │
│  ❌ Inflexible tax calculation engines                          │
│  ❌ Poor retroactive adjustment handling                        │
│  ❌ Limited audit trails                                        │
│  ❌ Siloed data with no real-time analytics                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## ✅ Our Solution

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  PeopleFlow HR Suite provides:                                 │
│                                                                 │
│  ✅ Multi-jurisdiction tax engine with formula support          │
│  ✅ Retroactive adjustments with delta tracking                 │
│  ✅ Real-time metrics with anomaly detection                    │
│  ✅ Comprehensive audit logs & permission snapshots             │
│  ✅ End-to-end type safety across frontend/backend              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Features

| Feature | Status | Description |
|---------|--------|-------------|
| **Multi-Tenancy** | ✅ | Organization-based isolation with role-based access |
| **Employee Management** | ✅ | Comprehensive employee records with department hierarchy |
| **Department Structure** | ✅ | Hierarchical departments and positions |
| **Tax Jurisdictions** | ✅ | Configurable tax rules per country/region |
| **Tax Calculation Engine** | ✅ | Progressive tax bands with formula evaluation (PAYE, NIS) |
| **Payroll Processing** | ✅ | Automated payroll runs with bulk processing |
| **Retroactive Adjustments** | ✅ | Delta-based corrections with approval workflow |
| **Real-time Metrics** | ✅ | Data freshness tracking and metric lineage |
| **Anomaly Detection** | ✅ | Configurable rules for metric anomalies |
| **Audit Logging** | ✅ | Comprehensive audit trail with permission snapshots |
| **Multi-Currency** | ✅ | Support for multiple currencies per jurisdiction |
| **Reports & Analytics** | ✅ | Customizable reports with export functionality |
| **Licensing System** | ⬜ | SaaS subscriptions and one-time perpetual licenses |
| **Mobile App** | ⬜ | React Native employee self-service portal |
| **Desktop App** | ⬜ | Tauri-based native desktop application |

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose | Badge |
|-----------|---------|-------|
| **React 19** | UI Library | ![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB) |
| **TanStack Router** | Type-safe routing | ![Router](https://img.shields.io/badge/TanStack-FF4154?style=flat&logo=react&logoColor=white) |
| **TailwindCSS** | Utility-first styling | ![Tailwind](https://img.shields.io/badge/Tailwind-38B2AC?style=flat&logo=tailwind-css&logoColor=white) |
| **shadcn/ui (maia)** | Component library | ![shadcn](https://img.shields.io/badge/shadcn-000000?style=flat&logo=shadcnui&logoColor=white) |
| **Framer Motion** | Animations | ![Framer](https://img.shields.io/badge/Framer-0055FF?style=flat&logo=framer&logoColor=white) |
| **HugeIcons** | Icon library | ![Icons](https://img.shields.io/badge/HugeIcons-4A5568?style=flat) |

### Backend
| Technology | Purpose | Badge |
|-----------|---------|-------|
| **Hono** | Web framework | ![Hono](https://img.shields.io/badge/Hono-E36002?style=flat&logo=hono&logoColor=white) |
| **oRPC** | Type-safe API layer | ![oRPC](https://img.shields.io/badge/oRPC-3178C6?style=flat) |
| **Drizzle ORM** | Database toolkit | ![Drizzle](https://img.shields.io/badge/Drizzle-C5F74F?style=flat&logo=drizzle&logoColor=black) |
| **PostgreSQL** | Database | ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white) |
| **Better Auth** | Authentication | ![Auth](https://img.shields.io/badge/Better--Auth-FF6B6B?style=flat) |

### DevOps & Tooling
| Technology | Purpose | Badge |
|-----------|---------|-------|
| **Bun** | Runtime & package manager | ![Bun](https://img.shields.io/badge/Bun-000000?style=flat&logo=bun&logoColor=white) |
| **Turborepo** | Monorepo build system | ![Turbo](https://img.shields.io/badge/Turborepo-EF4444?style=flat&logo=turborepo&logoColor=white) |
| **Ultracite** | Linting & formatting | ![Biome](https://img.shields.io/badge/Biome-60A5FA?style=flat&logo=biome&logoColor=white) |
| **Beads** | Issue tracking | ![Beads](https://img.shields.io/badge/Beads-8B5CF6?style=flat) |

---

## 🏗️ Architecture

### System Overview

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web App<br/>React + TanStack Router]
        MOBILE[Mobile App<br/>React Native + Expo]
        DESKTOP[Desktop App<br/>Tauri]
    end

    subgraph "API Layer"
        API[Hono Server<br/>oRPC Contracts]
    end

    subgraph "Business Logic"
        TAX[Tax Calculator]
        PAYROLL[Payroll Engine]
        METRICS[Metrics Service]
        RETRO[Retro Adjustments]
    end

    subgraph "Data Layer"
        DB[(PostgreSQL<br/>Drizzle ORM)]
    end

    WEB --> API
    MOBILE --> API
    DESKTOP --> API

    API --> TAX
    API --> PAYROLL
    API --> METRICS
    API --> RETRO

    TAX --> DB
    PAYROLL --> DB
    METRICS --> DB
    RETRO --> DB

    style WEB fill:#3b82f6
    style MOBILE fill:#3b82f6
    style DESKTOP fill:#3b82f6
    style API fill:#10b981
    style DB fill:#f59e0b
```

### Database Schema (ERD)

```mermaid
erDiagram
    ORGANIZATIONS ||--o{ DEPARTMENTS : has
    ORGANIZATIONS ||--o{ EMPLOYEES : employs
    ORGANIZATIONS ||--o{ ORGANIZATION_MEMBERS : has
    ORGANIZATIONS ||--o| TAX_JURISDICTIONS : "belongs to"

    DEPARTMENTS ||--o{ POSITIONS : contains
    DEPARTMENTS ||--o{ EMPLOYEES : manages

    POSITIONS ||--o{ EMPLOYEES : "assigned to"

    EMPLOYEES ||--o{ PAYSLIPS : receives
    EMPLOYEES ||--o{ RETRO_ADJUSTMENTS : has

    TAX_JURISDICTIONS ||--o{ INCOME_TAX_RULES : defines
    TAX_JURISDICTIONS ||--o{ SOCIAL_SECURITY_RULES : defines
    TAX_JURISDICTIONS ||--o{ FILING_REQUIREMENTS : requires

    PAYROLL_RUNS ||--o{ PAYSLIPS : contains

    EMPLOYEES ||--o{ PERMISSION_SNAPSHOTS : has
    EMPLOYEES ||--o{ AUDIT_LOG : tracked_in

    ORGANIZATIONS {
        uuid id PK
        string name
        string slug UK
        uuid jurisdictionId FK
        string timezone
        string currency
        date fiscalYearStart
        jsonb settings
    }

    EMPLOYEES {
        uuid id PK
        uuid organizationId FK
        uuid departmentId FK
        uuid positionId FK
        string employeeNumber UK
        string firstName
        string lastName
        string email
        date dateOfBirth
        date hireDate
        string employmentType
        decimal baseSalary
        string taxIdNumber
        string nisNumber
    }

    TAX_JURISDICTIONS {
        uuid id PK
        string countryCode
        string name
        string currency
        string timezone
        date fiscalYearStart
    }

    INCOME_TAX_RULES {
        uuid id PK
        uuid jurisdictionId FK
        int taxYear
        jsonb bands
        string personalDeductionFormula
    }
```

---

## 📊 Business Logic Flows

### Payroll Processing Flow

```mermaid
flowchart LR
    A[Start Payroll Run] --> B{Employees<br/>Selected?}
    B -->|Yes| C[Calculate Gross Pay]
    B -->|No| Z[End]

    C --> D[Fetch Tax Rules<br/>for Jurisdiction]
    D --> E[Calculate PAYE<br/>Progressive Bands]
    E --> F[Calculate NIS<br/>with Ceiling]
    F --> G[Apply Other<br/>Deductions]
    G --> H[Calculate Net Pay]
    H --> I[Generate Payslip]
    I --> J{More<br/>Employees?}
    J -->|Yes| C
    J -->|No| K[Finalize Payroll Run]
    K --> L[Update Metrics]
    L --> M[Detect Anomalies]
    M --> Z

    style A fill:#10b981
    style Z fill:#ef4444
    style E fill:#f59e0b
    style F fill:#f59e0b
```

### Tax Calculation Logic

```mermaid
flowchart TB
    START[Gross Annual Salary] --> PD[Calculate Personal<br/>Deduction]
    PD --> FORMULA{Evaluate<br/>Formula}
    FORMULA --> TAXABLE[Taxable Income =<br/>Gross - Deduction]

    TAXABLE --> BAND1{Amount in<br/>Band 1?}
    BAND1 -->|Yes| TAX1[Tax = Amount × Rate1]
    BAND1 -->|No| BAND2

    TAX1 --> BAND2{Remainder in<br/>Band 2?}
    BAND2 -->|Yes| TAX2[Tax += Remainder × Rate2]
    BAND2 -->|No| TOTAL

    TAX2 --> TOTAL[Total PAYE Tax]
    TOTAL --> MONTHLY[Monthly Tax =<br/>Total / 12]
    MONTHLY --> END[Return Tax Amount]

    style START fill:#3b82f6
    style END fill:#10b981
    style FORMULA fill:#f59e0b
```

---

## 🚀 Quick Start

### Prerequisites

- **Bun** >= 1.0
- **PostgreSQL** >= 14
- **Node.js** >= 18 (for some tooling)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/PeopleFlow-HR-Suite.git
cd PeopleFlow-HR-Suite

# Install dependencies
bun install

# Initialize Beads issue tracking
npm install -g @beads/bd
bd init
```

### Database Setup

```bash
# 1. Create PostgreSQL database
createdb peopleflow_hr

# 2. Copy environment file
cp apps/server/.env.example apps/server/.env

# 3. Update DATABASE_URL in apps/server/.env
# DATABASE_URL="postgresql://user:password@localhost:5432/peopleflow_hr"

# 4. Push schema to database
bun run db:push

# 5. (Optional) Seed Guyana tax rules
bun run db:seed
```

### Development

```bash
# Start all applications (web, server, native)
bun run dev

# Or start individually:
bun run dev:web      # Frontend at http://localhost:3001
bun run dev:server   # Backend at http://localhost:3000
bun run dev:native   # React Native with Expo
```

### Code Quality

```bash
# Format and lint
bun x ultracite fix

# Type check
bun run typecheck

# Run all checks
bun run check
```

---

## 📁 Project Structure

```
PeopleFlow-HR-Suite/
├── 📱 apps/
│   ├── web/                    # React frontend
│   │   ├── src/
│   │   │   ├── routes/         # TanStack Router pages
│   │   │   ├── components/     # UI components
│   │   │   ├── lib/            # Client utilities
│   │   │   └── utils/          # oRPC client
│   │   └── components.json     # shadcn config (maia style)
│   │
│   ├── server/                 # Hono backend
│   │   ├── src/
│   │   │   ├── index.ts        # Server entry
│   │   │   └── routes/         # API routes
│   │   └── .env                # Environment variables
│   │
│   └── native/                 # React Native mobile
│       └── src/
│
├── 📦 packages/
│   ├── api/                    # Shared API logic
│   │   ├── src/
│   │   │   ├── routers/        # oRPC routers
│   │   │   │   ├── organizations.ts
│   │   │   │   ├── departments.ts
│   │   │   │   ├── employees.ts
│   │   │   │   └── index.ts
│   │   │   └── services/       # Business logic
│   │   │       ├── tax-calculator.ts
│   │   │       ├── payroll-service.ts
│   │   │       ├── retro-adjustment-service.ts
│   │   │       ├── metrics-service.ts
│   │   │       └── permission-service.ts
│   │
│   ├── db/                     # Database layer
│   │   ├── src/
│   │   │   ├── schema/         # Drizzle schemas
│   │   │   │   ├── organizations.ts
│   │   │   │   ├── departments.ts
│   │   │   │   ├── employees.ts
│   │   │   │   ├── tax-jurisdictions.ts
│   │   │   │   ├── payroll.ts
│   │   │   │   ├── retro-adjustments.ts
│   │   │   │   ├── metrics.ts
│   │   │   │   ├── anomalies.ts
│   │   │   │   ├── permissions.ts
│   │   │   │   └── index.ts
│   │   │   └── seeds/          # Seed data
│   │   │       └── guyana-tax-rules.ts
│   │
│   ├── auth/                   # Authentication
│   ├── env/                    # Environment validation
│   └── config/                 # Shared TypeScript config
│
├── 🎯 .beads/                  # Issue tracking
│   └── metadata.json
│
├── 📚 docs/                    # Documentation
│   └── spec.md                 # Full specification
│
├── ⚙️ Configuration Files
├── biome.json                  # Biome config
├── turbo.json                  # Turborepo config
├── bts.jsonc                   # Better-T-Stack config
└── CLAUDE.md                   # AI agent instructions
```

---

## 🔌 API Reference

### Organizations

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/organizations` | GET | List all organizations | ✅ |
| `/api/organizations/:id` | GET | Get organization details | ✅ |
| `/api/organizations` | POST | Create organization | ✅ Admin |
| `/api/organizations/:id` | PATCH | Update organization | ✅ Admin |
| `/api/organizations/:id` | DELETE | Delete organization | ✅ Admin |

### Employees

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/employees` | GET | List employees | ✅ |
| `/api/employees/:id` | GET | Get employee details | ✅ |
| `/api/employees` | POST | Create employee | ✅ Manager |
| `/api/employees/:id` | PATCH | Update employee | ✅ Manager |
| `/api/employees/:id` | DELETE | Deactivate employee | ✅ Manager |

### Departments

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/departments` | GET | List departments | ✅ |
| `/api/departments/:id` | GET | Get department details | ✅ |
| `/api/departments` | POST | Create department | ✅ Manager |
| `/api/departments/:id` | PATCH | Update department | ✅ Manager |

### Payroll (Coming Soon)

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/payroll/runs` | GET | List payroll runs | ✅ |
| `/api/payroll/runs` | POST | Start payroll run | ✅ Payroll Admin |
| `/api/payroll/runs/:id/finalize` | POST | Finalize payroll | ✅ Payroll Admin |
| `/api/payroll/payslips/:employeeId` | GET | Get employee payslips | ✅ |

### Tax Calculator

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/tax/calculate-paye` | POST | Calculate PAYE tax | ✅ |
| `/api/tax/calculate-nis` | POST | Calculate NIS contributions | ✅ |
| `/api/tax/jurisdictions` | GET | List tax jurisdictions | ✅ Admin |

**Interactive API Documentation:** [http://localhost:3000/api-reference](http://localhost:3000/api-reference)

---

## 🗓️ Roadmap

### Phase 1: Foundation Setup ✅
- [x] Beads issue tracking integration
- [x] Frontend style migration to maia + HugeIcons + Framer Motion
- [x] Organizations schema (multi-tenancy)

### Phase 2: Core HR Tables ✅
- [x] Database schemas for departments, positions, employees
- [x] API routers for organizations, departments, employees
- [x] Modular router structure

### Phase 3: Multi-Country Tax System ✅
- [x] Tax jurisdictions schema
- [x] Income tax rules with progressive bands
- [x] Social security rules with ceilings
- [x] Tax calculation engine with formula evaluation
- [x] Guyana seed data

### Phase 4: Payroll & Retroactive Adjustments ✅
- [x] Payroll runs and payslips schema
- [x] Retroactive adjustments with delta tracking
- [x] Approval workflow for adjustments
- [x] Payroll processing service

### Phase 5: Analytics & Metrics System ✅
- [x] Metric dependencies and lineage tracking
- [x] Data freshness indicators
- [x] Anomaly detection rules
- [x] Real-time metrics dashboard

### Phase 6: Permissions & Audit System ✅
- [x] Permission snapshots for audit
- [x] Comprehensive audit log
- [x] Historical permission queries
- [x] Scope-based access control

### Phase 7: UI Components & Pages 🚧
- [x] shadcn components integration
- [x] Basic route structure implementation
- [x] Dashboard with real-time metrics
- [ ] Custom components (data freshness, tax band editor, payslip viewer)
- [ ] Complete employee and department pages

### Phase 8: Reports & Compliance ✅
- [x] Report generation engine
- [x] Export functionality (PDF, Excel, CSV)
- [x] Compliance filing forms
- [x] Government submission templates

### Phase 9: Licensing & Monetization ⬜
- [ ] SaaS subscription tiers (Starter, Professional, Enterprise)
- [ ] One-time perpetual license option
- [ ] License key validation system
- [ ] Enterprise pricing inquiry workflow

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards

This project uses **Ultracite** for code quality:

```bash
# Before committing
bun x ultracite fix
bun run typecheck
```

See [CLAUDE.md](./CLAUDE.md) for detailed coding standards.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

Built with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack) - A modern TypeScript stack combining the best tools in the ecosystem.

---

<div align="center">

**[⬆ Back to Top](#-peopleflow-hr-suite)**

Made with ❤️ using Better-T-Stack

</div>
