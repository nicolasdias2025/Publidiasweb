# Sistema Corporativo Interno

## Overview

Sistema Corporativo Interno is a comprehensive internal business management platform built for managing budgets, approvals, invoices, administrative tasks, and marketing campaigns. The system provides a professional, responsive interface with secure authentication and modular architecture designed for enterprise productivity workflows.

The application handles specialized budget creation for official newspaper publications (e.g., Diário Oficial da União), complete approval workflows, invoice management, document control, and marketing campaign tracking with lead management.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Updates (Session: NOTAS FISCAIS + UI Polish)

### Dashboard - Notas Fiscais Panel ✅
- Panel now correctly fetches budgets with `jornalConfirmed = true`
- Supports NF number input + Jornal/Cliente confirmation buttons
- PATCH operations for `/api/budgets/{id}` with nfNumber, nfJornalSent, nfClienteSent
- Filters out completed entries (all 3 flags set)
- Email copy-to-clipboard for client contact

### UI Standardization & Polish ✅
- **Gestão Administrativa - Publicações**: Title updated to "Publicações - Relatórios" (text-3xl)
- **Gestão de Orçamentos - Reports**: Title "Orçamentos - Relatórios" upgraded to text-3xl
- **Gestão Administrativa - Faturamento**: Title updated to "Faturamento - Relatórios" (text-3xl)
- **Marketing Module**: Removed "Central de Dados" tab, capitalized month names in calendar (Janeiro, Fevereiro, etc.)
- **Notas Fiscais Panel**: Layout standardized to full-width (removed container mx-auto)

### Database Schema (budgets table) ✅
- `nfNumber` (text): Number of the fiscal note entered by user
- `nfJornalSent` (boolean): Journal/Newspaper notification sent flag
- `nfClienteSent` (boolean): Client/Customer notification sent flag
- Fields default to false, allowing partial completion tracking

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React 18+ with TypeScript for type safety
- Vite as build tool and development server
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management and caching
- React Hook Form with Zod resolvers for form validation

**UI Component System:**
- shadcn/ui component library (Radix UI primitives)
- Tailwind CSS for styling with custom design tokens
- Design approach: Enterprise productivity (inspired by Linear + Notion)
- Typography: Inter font for interface, JetBrains Mono for data/monospace
- Theme system: Light/dark mode support via context provider
- Responsive layout: Fixed sidebar (280px) + flexible content area

**State Management:**
- Server state: TanStack Query with infinite stale time and disabled refetch
- Form state: React Hook Form
- Authentication state: Custom `useAuth` hook with query-based user session
- UI state: React Context (Theme, Sidebar)

**Key Design Patterns:**
- Component composition with Radix UI Slot pattern
- Custom hooks for reusable logic (`useAuth`, `useToast`, `useIsMobile`)
- Path aliases for clean imports (`@/`, `@shared/`, `@assets/`)
- Centralized API client with credential-based requests

### Backend Architecture

**Technology Stack:**
- Node.js with Express.js REST API
- TypeScript throughout for type safety
- Drizzle ORM for database operations
- Local username/password authentication with bcrypt

**API Structure:**
- RESTful endpoints following standard CRUD patterns:
  - `GET /api/resource` - List all
  - `GET /api/resource/:id` - Get by ID
  - `POST /api/resource` - Create
  - `PATCH /api/resource/:id` - Update
  - `DELETE /api/resource/:id` - Delete
- Authentication middleware: `isAuthenticated` guard on protected routes
- Centralized route registration in `server/routes.ts`
- Request/response logging middleware with duration tracking

**Authentication System:**
- Local authentication with username/password only (sem e-mail, sem Replit Auth)
- Password hashing using bcrypt with configurable salt rounds
- JWT-based auth — tokens stored in localStorage (no sessions)
- 7-day JWT expiry
- Auth routes in `server/localAuth.ts`:
  - `POST /api/auth/login` - Login with username/password (returns role + requirePasswordChange)
  - `POST /api/auth/logout` - Client-side token discard
  - `GET /api/auth/user` - Get current authenticated user (JWT)
  - `PATCH /api/auth/change-password` - Force password change on first access (requires auth)
- Admin-only routes (require `role === 'admin'`):
  - `GET /api/admin/users` - List all users
  - `POST /api/admin/users` - Create new collaborator with temp password
- Public `/api/auth/register` removed — user creation is admin-only

**Security Model:**
- `role` field: "user" (default) or "admin"
- `requirePasswordChange` (boolean, default true): forces new user to set personal password on first login
- Admin creates collaborator → collaborator must change temp password on first access
- Non-admin users cannot see "/admin/usuarios" route or sidebar item

**Data Layer:**
- Storage abstraction layer (`server/storage.ts`) implementing `IStorage` interface
- All CRUD operations go through storage layer for consistency
- PostgreSQL connection via Neon Serverless driver with WebSocket support
- Connection pooling for performance

### Database Schema

**Core Tables:**
- `sessions` - Session storage for authentication
- `users` - User accounts with username, passwordHash, profile info (no email — login exclusivamente por username)
- `budgets` - Budget quotes for newspaper publications with line items + NF tracking fields
- `approvals` - Approval workflows with type, requester, status
- `invoices` - Invoice records with client, amounts, tax details
- `documents` - Administrative document management
- `processes` - Internal process tracking
- `campaigns` - Marketing campaign management
- `leads` - Lead/prospect tracking

**Schema Design Patterns:**
- UUID primary keys via `gen_random_uuid()`
- Timestamps: `createdAt` (default now), `updatedAt` (auto-updated)
- JSONB columns for flexible structured data (budget lines, session data)
- Decimal types for financial values to avoid floating-point issues
- Foreign key relationships (e.g., budgets/approvals to users)
- Indexed columns for query performance (session expiry)

**ORM Integration:**
- Drizzle ORM with Zod schema validation
- Type-safe queries with full TypeScript inference
- Shared schema types between frontend and backend via `@shared/schema`
- Insert schemas with Zod for runtime validation
- Migration management via `drizzle-kit push`

### Module System

The application is organized into six main functional modules:

1. **Orçamentos (Budgets)** - Specialized for official newspaper publication quotes
   - Multi-line budget entries (up to 5 lines)
   - Automatic total calculation: format × value_cm_col + diagramação
   - Client email management
   - Status tracking (draft, pending, approved)
   - Jornal Confirmation workflow → Notas Fiscais tracking

2. **Autorizações (Approvals)** - Workflow management with Google Sheets integration
   - Two-part form: Client data + Publication data
   - **Auto-fill client data**: Enter CNPJ → automatically fills Razão Social, Email, Endereço, Cidade, UF, CEP from Google Sheets
   - Accepts CNPJ with or without formatting (88.847.660/0001-53 or 88847660000153)
   - Real-time lookup with 500ms debounce and loading indicator
   - 1-hour cache for improved performance
   - Request type categorization and status tracking
   - Department tracking and approval workflow

3. **Notas Fiscais (Invoices Management)** - Invoice management integrated with Budgets
   - Budgets with `jornalConfirmed = true` appear in Notas Fiscais panel
   - NF number input + Jornal/Cliente confirmation buttons
   - Tracks: nfNumber, nfJornalSent, nfClienteSent
   - Automatic filtering of completed entries
   - Email copy-to-clipboard for client communication

4. **Gestão Administrativa** - Administrative management
   - **Publicações - Relatórios**: Publication tracking and reporting
   - **Faturamento - Relatórios**: Invoice management and financial reporting
   - Document repository with categories
   - Internal process tracking
   - Deadline management
   - Status workflows

5. **Marketing** - Campaign and lead management
   - **Calendário**: Activity calendar with monthly view
   - **Central de Conteúdo**: Content library and management
   - Multi-channel campaign tracking
   - Lead scoring and status
   - Conversion metrics
   - Campaign timeline management

6. **Dashboard** - Overview and metrics
   - Statistical cards with trends
   - Recent activity feeds (Orçamentos, Autorizações, Notas Fiscais, Marketing)
   - Quick access to pending items
   - Panel-based layout for focused visibility

### Audit System ✅

**Audit Panel** - Admin-only audit trail (`/admin/auditoria`)
- **Features**: Action logging, module filtering, user filtering, pagination
- **Logged Actions**: Create, Update, Delete, Login, Logout
- **Modules**: Orçamentos, Notas Fiscais, Cadastro de Clientes, Autorizações, Marketing
- **API**: `GET /api/audit-logs` (admin-only, supports filters & pagination)
- **Storage**: `auditLogs` table with JOINs to users for username resolution
- **Frontend**: `admin-auditoria.tsx` with Select filters and table pagination

### Build and Deployment

**Development:**
- `npm run dev` - Vite dev server with HMR + Express API
- Hot module replacement for instant feedback
- Replit-specific plugins for dev environment
- TypeScript checking via `npm run check`

**Production Build:**
- Client: Vite builds React app to `dist/public`
- Server: esbuild bundles Express to `dist/index.js`
- Single-command build: `npm run build`
- Environment-aware: `NODE_ENV` controls behavior

**Deployment Targets:**
- Primary: Replit (native integration)
- Alternative: UOL Host (PostgreSQL compatible)
- Database: Any PostgreSQL instance via `DATABASE_URL`

### Google Sheets Integration

**Service Implementation:**
- Singleton service (`server/services/googleSheetsService.ts`) for Google Sheets API interaction
- Service Account authentication using `googleapis` library
- In-memory cache with 1-hour TTL for optimal performance

**Configuration:**
- `GOOGLE_SHEETS_CREDENTIALS`: Service Account JSON (supports raw JSON or base64 encoded)
- `GOOGLE_SHEETS_SHEET_ID`: Target spreadsheet ID
- Sheet structure: First sheet, columns A-G (CNPJ, Razão Social, Endereço, Cidade, CEP, UF, Email)
- Range: `A2:G` (row 1 reserved for headers)

**Features:**
- CNPJ normalization: Accepts formatted (88.847.660/0001-53) or unformatted (88847660000153)
- Automatic client data lookup via `GET /api/clients/lookup?cnpj={cnpj}`
- Frontend hook `useClientLookup` with 500ms debounce
- Loading indicators and toast notifications
- Cache management with hit/miss logging

**API Response:**
```json
{
  "cnpj": "88.847.660/0001-53",
  "razaoSocial": "Company Name",
  "email": "contact@company.com",
  "endereco": "Street Address",
  "cidade": "City",
  "cep": "12345-678",
  "uf": "SP"
}
```

## External Dependencies

**Authentication Provider:**
- Replit Auth (OpenID Connect)
- Issuer URL: `https://replit.com/oidc` or custom via `ISSUER_URL`
- Requires: `REPL_ID`, `SESSION_SECRET` environment variables

**Database:**
- PostgreSQL database (Neon Serverless compatible)
- Required: `DATABASE_URL` environment variable
- WebSocket support via `ws` package for Neon driver
- Session table must exist for authentication

**Third-Party UI Libraries:**
- Radix UI primitives (30+ components)
- shadcn/ui component patterns
- Tailwind CSS framework
- Lucide React icons
- Google Fonts (Inter, JetBrains Mono)

**Development Tools:**
- Vite plugins for Replit integration (cartographer, dev-banner, runtime errors)
- TypeScript for type checking
- Drizzle Kit for database migrations
- ESBuild for server bundling

**Session Storage:**
- `connect-pg-simple` for PostgreSQL session store
- Automatic session cleanup based on TTL
- Session table structure defined in schema
