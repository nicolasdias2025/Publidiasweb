# Design Guidelines: Sistema Corporativo Interno

## Design Approach

**Selected Approach:** Design System (Enterprise Productivity)

**Primary Inspiration:** Linear + Notion + Modern Enterprise Dashboards

**Justification:** This is a utility-focused, information-dense internal tool requiring efficiency, clear data hierarchy, and professional credibility. The design must support daily operational workflows with minimal cognitive load.

---

## Typography

**Font Stack:**
- **Primary:** Inter (via Google Fonts CDN) - all interface text
- **Monospace:** JetBrains Mono - data tables, invoice numbers, IDs

**Type Scale:**
- Page Headers: `text-3xl font-bold` (h1)
- Section Headers: `text-xl font-semibold` (h2)
- Card/Module Titles: `text-lg font-medium` (h3)
- Body Text: `text-base font-normal`
- Secondary/Meta: `text-sm`
- Captions/Labels: `text-xs font-medium uppercase tracking-wide`

---

## Layout System

**Spacing Primitives:** Tailwind units of **2, 4, 6, 8, 12, 16**
- Tight spacing: `gap-2`, `p-2`
- Standard spacing: `gap-4`, `p-4`, `m-4`
- Section spacing: `gap-8`, `py-8`, `px-6`
- Major sections: `py-12`, `px-8`

**Grid Structure:**
- Main Layout: Fixed sidebar (280px) + flexible content area
- Dashboard Cards: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`
- Data Tables: Full-width with horizontal scroll on mobile
- Forms: Single column with `max-w-2xl`, two-column for related fields

---

## Component Library

### Navigation

**Sidebar (Fixed Left):**
- Width: `w-70` (280px)
- Module sections grouped with dividers
- Active state: Subtle background, bold text, left border accent
- Icons: Heroicons outline (inactive), solid (active)
- Compact footer with user profile and logout

**Top Bar:**
- Height: `h-16`
- Contains: Breadcrumbs (left), Search (center), Notifications + Profile (right)
- Sticky positioning: `sticky top-0`

### Dashboard Components

**Stat Cards:**
- Grid of 2-4 cards showing KPIs per module
- Structure: Large number (text-4xl), label (text-sm), trend indicator
- Padding: `p-6`
- Border: `border rounded-lg`

**Data Tables:**
- Sticky header row
- Alternating row treatment for readability
- Action buttons (icon-only) in last column
- Pagination footer
- Sortable columns with arrow indicators

**Module Cards:**
- Recent items preview (5 rows max)
- "Ver todos" link to full module
- Border: `border rounded-lg`
- Padding: `p-6`

### Forms

**Input Fields:**
- Label above input: `text-sm font-medium mb-2`
- Input height: `h-10` or `h-12` for primary fields
- Border: `border rounded-md`
- Focus state: Ring treatment
- Error state: Red border + error text below

**Buttons:**
- Primary: `h-10 px-6 rounded-md font-medium`
- Secondary: Same size, outlined style
- Ghost/Text: For tertiary actions
- Icon buttons: `w-10 h-10` square

**Form Layout:**
- Two-column for related fields: `grid-cols-2 gap-4`
- Full-width for text areas and complex inputs
- Action buttons right-aligned at bottom
- Cancel (secondary) + Submit (primary)

### Module-Specific Components

**Orçamentos (Budgets):**
- Status badges: `inline-flex items-center px-3 py-1 rounded-full text-xs font-medium`
- Line items table with editable rows
- Total summary section (sticky bottom)

**Autorizações (Approvals):**
- Timeline/stepper for approval workflow
- Approve/Reject button pair (prominent)
- Comment/notes textarea
- History log with timestamps

**Notas Fiscais (Invoices):**
- Invoice preview card (mimics paper invoice)
- PDF generation button (prominent)
- Calculation breakdown table
- Tax fields grouped and highlighted

**Gestão Administrativa:**
- Document upload area (drag-and-drop)
- Category tags/filters
- Tabbed sections for different record types

**Marketing:**
- Campaign cards with metrics
- Lead list with status pipeline
- Calendar view for scheduled actions

### Overlays

**Modals:**
- Max width: `max-w-2xl` (standard), `max-w-4xl` (wide for invoices)
- Padding: `p-6`
- Close button: Top-right corner
- Actions: Footer with cancel + primary action

**Toast Notifications:**
- Position: Top-right
- Types: Success, Error, Warning, Info
- Auto-dismiss after 5s
- Icon + message + close button

---

## Responsive Behavior

**Mobile (<768px):**
- Sidebar collapses to hamburger menu
- Single column layouts
- Tables scroll horizontally
- Stat cards stack vertically
- Reduced padding: `p-4` instead of `p-6`

**Tablet (768px-1024px):**
- Sidebar can be toggled
- Two-column grids where appropriate
- Tables maintain full structure

**Desktop (>1024px):**
- Full sidebar always visible
- Three-column dashboard grids
- Side-by-side form layouts

---

## Key Interaction Patterns

**Loading States:**
- Skeleton loaders for tables and cards
- Spinner for button actions
- Progressive loading for large datasets

**Empty States:**
- Centered icon + message + CTA button
- Helpful guidance text
- "Create first item" action

**Permissions:**
- Disabled state for unauthorized actions
- Tooltip explaining why action is unavailable
- Visual hierarchy: hide vs disable based on context

---

## Iconography

**Library:** Heroicons (via CDN)
- Navigation: 24px icons
- Buttons: 20px icons
- Inline indicators: 16px icons

---

## Accessibility

- Form inputs: Proper label associations
- ARIA labels for icon-only buttons
- Keyboard navigation: Focus states clearly visible
- Error announcements for screen readers
- Sufficient contrast ratios throughout

---

## Design Principles

1. **Clarity Over Decoration:** Every element serves a functional purpose
2. **Consistent Hierarchy:** Visual weight matches importance
3. **Efficient Workflows:** Common tasks require minimal clicks
4. **Data Legibility:** Tables and numbers are easy to scan
5. **Professional Polish:** Refined but not flashy