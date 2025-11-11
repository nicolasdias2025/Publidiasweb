# Sistema Corporativo Interno

## Overview

Sistema Corporativo Interno is a comprehensive internal business management platform built for managing budgets, approvals, invoices, administrative tasks, and marketing campaigns. The system provides a professional, responsive interface with secure authentication and modular architecture designed for enterprise productivity workflows.

The application handles specialized budget creation for official newspaper publications (e.g., Diário Oficial da União), complete approval workflows, invoice management, document control, and marketing campaign tracking with lead management.

## User Preferences

Preferred communication style: Simple, everyday language.

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
- OpenID Connect (OIDC) via Passport.js for authentication

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
- Replit Auth via OpenID Connect (supports Google, GitHub, email/password)
- Session-based authentication using PostgreSQL session store
- 7-day session TTL with secure, httpOnly cookies
- User session management with automatic user upsert on login
- Memoized OIDC configuration for performance

**Data Layer:**
- Storage abstraction layer (`server/storage.ts`) implementing `IStorage` interface
- All CRUD operations go through storage layer for consistency
- PostgreSQL connection via Neon Serverless driver with WebSocket support
- Connection pooling for performance

### Database Schema

**Core Tables:**
- `sessions` - Session storage (required for Replit Auth)
- `users` - User accounts with email, name, profile image
- `budgets` - Budget quotes for newspaper publications with line items
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

2. **Autorizações (Approvals)** - Workflow management
   - Request type categorization
   - Department tracking
   - Approval status (pending, approved, rejected)
   - Request value and description

3. **Notas Fiscais (Invoices)** - Invoice management
   - Client invoicing with tax calculations
   - Issue date tracking
   - Status management (issued, cancelled)
   - PDF generation capability

4. **Gestão Administrativa** - Administrative management
   - Document repository with categories
   - Internal process tracking
   - Deadline management
   - Status workflows

5. **Marketing** - Campaign and lead management
   - Multi-channel campaign tracking
   - Lead scoring and status
   - Conversion metrics
   - Campaign timeline management

6. **Dashboard** - Overview and metrics
   - Statistical cards with trends
   - Recent activity feeds
   - Quick access to pending items

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