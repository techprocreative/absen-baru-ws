# Design Guidelines: Facial Recognition Attendance Management System

## Design Approach
**Reference-Based System:** Drawing from BambooHR and Workday's professional HR platform aesthetics, combined with Linear's clean dashboard patterns for modern enterprise applications. This utility-focused application prioritizes clarity, efficiency, and data accessibility.

## Color System (User-Specified)
- **Primary:** #2563EB (Professional Blue) - CTAs, active states, primary actions
- **Secondary:** #059669 (Success Green) - Check-in confirmations, positive indicators
- **Background:** #F8FAFC (Light Grey) - Main canvas, card backgrounds
- **Text:** #1E293B (Slate Grey) - Primary text, headings
- **Accent:** #7C3AED (Purple) - Highlights, special features, badges
- **Warning:** #DC2626 (Red) - Alerts, absences, late indicators

## Typography
- **Fonts:** Inter for UI elements, Roboto for data tables (via Google Fonts CDN)
- **Hierarchy:** 
  - Page Titles: 32px/bold
  - Section Headers: 24px/semibold
  - Card Headers: 18px/medium
  - Body Text: 16px/regular
  - Labels/Meta: 14px/medium
  - Data Tables: 15px/regular

## Layout Architecture

### Dashboard Structure
**Persistent Sidebar Navigation (240px width):**
- Logo and role indicator at top
- Icon + label menu items
- User profile section at bottom
- Collapsible on mobile (hamburger menu)

**Main Content Area:**
- Top bar: Page title, breadcrumbs, quick actions, user avatar
- Content grid using 12-column system
- Responsive breakpoints: Mobile (1 col), Tablet (2 col), Desktop (3-4 col)

### Spacing System
**Tailwind Units:** Consistently use 2, 4, 6, 8, 12, 16, 20, 24 units
- Component padding: p-6
- Card spacing: p-8
- Section gaps: gap-6
- Page margins: px-6 md:px-12

## Core Components

### Cards (Foundation Element)
- White background with subtle shadow (0 1px 3px rgba(0,0,0,0.1))
- Rounded corners (8px)
- Padding: 24px
- Border: 1px solid #E2E8F0

### Data Tables
- Zebra striping with alternating row backgrounds
- Sortable column headers with icons
- Row hover state (#F1F5F9)
- Action buttons aligned right in each row
- Pagination controls at bottom

### Attendance Calendar
- Monthly grid view with color-coded cells
- Green (#059669): Present
- Red (#DC2626): Absent  
- Yellow (#F59E0B): Late
- Grey (#94A3B8): Weekend/Holiday
- Click cells for daily details modal

### Face Recognition Interface
- Centered camera preview (640x480px)
- Circular face detection overlay
- Real-time feedback indicators
- Capture button with countdown timer
- Success/error state messaging

### Dashboard Stats Cards
- Large number display (36px/bold)
- Descriptive label below (14px)
- Trend indicator (arrow + percentage)
- Icon in colored circle background
- 4-column grid on desktop

### Navigation Patterns
**Admin Dashboard Tabs:**
- Employees | Attendance | Reports | Settings

**HR Dashboard Tabs:**  
- Overview | Analytics | Reports | Employees

**Employee Dashboard:**
- My Attendance | Check-In/Out | Profile

## Page-Specific Layouts

### Login Page
Clean centered card (max-width: 400px) with:
- Logo and application name
- Email/password inputs
- Role selector dropdown
- Primary action button
- Background: Subtle gradient from #F8FAFC to #E0E7FF

### Employee Dashboard
**Hero Section:** Greeting + Quick Check-In/Out button (large, prominent)
**Stats Row:** Today's Status | This Month Hours | This Week Attendance
**Attendance Calendar:** Current month view
**Recent Activity Table:** Last 10 check-ins/outs

### Admin Dashboard  
**Overview Grid:** Total Employees | Today's Present | This Month Absent | Pending Approvals
**Quick Actions Bar:** Add Employee | Generate Report | View Attendance
**Recent Employees Table:** With edit/delete actions
**Attendance Summary Chart:** Bar chart for weekly trends

### HR Dashboard
**Analytics Section:** Multiple stat cards in 4-column grid
**Filters Bar:** Date range picker, department selector, employee search
**Reports Table:** Exportable data with CSV download
**Department Breakdown:** Pie chart visualization

### Employee Management
**List View:** Searchable table with filters (department, status)
**Add/Edit Modal:** Form with face photo upload, personal details, department assignment
**Profile Cards:** Photo, name, employee ID, department, join date

## Form Design
- Full-width inputs with clear labels above
- Placeholder text in lighter grey
- Focus state: Blue border (#2563EB)
- Error state: Red border with message below
- Submit buttons: Primary blue, full-width on mobile

## Icons
**Heroicons library via CDN** for all interface icons:
- Navigation: outline style
- Actions: solid style  
- Status indicators: solid style with color fills

## Images
**Profile Photos:**
- Circular avatars (40px in tables, 120px in profiles)
- Default placeholder for missing photos

**Face Recognition:**
- Live camera feed in enrollment/check-in
- Stored face templates (not visible to users)

**No hero images** - Dashboard applications prioritize immediate functionality over marketing visuals.

## Responsive Behavior
- **Desktop (1024px+):** Full sidebar, 3-4 column grids
- **Tablet (768-1023px):** Collapsible sidebar, 2 column grids  
- **Mobile (<768px):** Bottom tab bar navigation, single column, stacked cards

## Interactive States
- Buttons: Subtle scale on hover (0.98), opacity 0.9 on active
- Cards: Lift shadow on hover for clickable items
- Table rows: Background change on hover
- Forms: Border color change on focus

**No animated transitions** except for modal/drawer entry-exit and subtle hover effects to maintain professional, performance-focused experience.