# Planning Guide

نظام ذكي متكامل لإدارة الجداول المدرسية والحصص الاحتياطية يعتمد على ملفات XML المستخرجة من برنامج aSc Timetables لتسهيل عمل إدارات المدارس في تنظيم الجداول وتوزيع الحصص ومتابعة غياب المعلمين.

**Experience Qualities**:
1. **Efficient** - System must process XML files quickly and present data in immediately actionable formats for busy school administrators
2. **Trustworthy** - Arabic text rendering, data integrity checks, and clear error messaging build confidence in critical scheduling decisions
3. **Accessible** - Responsive design enables mobile access for on-the-go absence reporting and schedule checking during the school day

**Complexity Level**: Light Application (multiple features with basic state)
This system handles XML parsing, user authentication, role-based views, and data management but doesn't require complex backend infrastructure. All data persists in browser storage, making it ideal for individual school deployments.

## Essential Features

### XML File Upload & Parsing
- **Functionality**: Upload and parse aSc Timetables XML files with **automatic UTF-8 conversion without BOM**, automatic star removal, comprehensive data extraction (teachers, classes, subjects, periods, schedules), **immediate display of teacher data with subjects and weekly period counts**, **approval workflow with visual status badges**, and **individual schedule deletion capability**. **All navigation buttons require an approved schedule to display data** - system enforces approval workflow. **Gender information is not stored or displayed** as all teachers within a school typically belong to a single category.
- **Purpose**: Automate schedule data entry with robust error handling and user guidance to ensure accurate Arabic text rendering and complete data import. Files are automatically normalized to UTF-8 without BOM regardless of source encoding (ANSI, UTF-8 with BOM, etc.). Immediately after successful upload, display a comprehensive table showing all teachers with their subjects and weekly period counts. **Gender field from XML is ignored during parsing** to simplify the interface as this information is not relevant for single-gender schools. **Require explicit approval before data becomes accessible throughout the system** - protecting against accidental use of incorrect data. Provide approval mechanism to confirm data accuracy before system-wide use, and allow deletion of specific schedules.
- **Trigger**: User clicks "تحميل الجدول" button and selects XML file, or accesses "دليل التحضير" for preparation guidance, or clicks "اعتماد البيانات" to approve uploaded data, or clicks delete icon to remove schedule
- **Progression**: File select → **Automatic UTF-8 without BOM conversion** → Toast notification showing conversion in progress → Automatic star (*) removal from IDs → XML parsing → Multi-section data extraction (days, periods, teachers, classes, subjects, classrooms, schedules) → **Gender field ignored** → Subject-teacher relationship mapping → Weekly period counting per teacher → Encoding validation → Error/warning display → Success confirmation with emoji indicators (✅/❌) → **Teacher data table display with statistics cards** → **Approval prompt with warning alert** → User reviews and clicks "اعتماد البيانات" → **Approval status saved to schedule data** → Timestamp recorded → Badge updated to "معتمد" → Data storage with approval status → **All other pages now show this approved data**
- **Success criteria**: System automatically converts any encoding to UTF-8 without BOM before processing; correctly extracts all data sections; **ignores gender attribute from XML**; automatically fixes star notation in IDs; maps subjects to teachers based on TimeTableSchedule entries; calculates accurate weekly period counts for each teacher; displays teacher table with four columns (Number, Name, Short Name, Subject, Weekly Periods) without gender information; shows summary statistics (total teachers, total periods, average periods); detects and reports Arabic encoding issues; shows detailed warnings for missing UTF-8 headers and duplicate entries; provides interactive guide with downloadable sample XML; displays comprehensive statistics of extracted data; shows clear success/error messages with emoji indicators; displays prominent "اعتماد البيانات" and "حذف البيانات" buttons; shows visual approval status badge (معتمد/غير معتمد); displays approval timestamp; disables approval button after confirmation; shows delete button for each uploaded schedule with hover effect; confirms deletion with warning dialog; **all system pages filter data to show only approved schedules**; **pages display warning message when no approved schedule exists**

### User Authentication & Role Management
- **Functionality**: Three-tier access system (System Admin, School Director, Teacher) with role-based permissions
- **Purpose**: Secure access control ensuring users only see and modify data appropriate to their role
- **Trigger**: User clicks "تسجيل الدخول" and enters credentials
- **Progression**: Login click → Credential entry → Role verification → Permission assignment → Dashboard redirect based on role
- **Success criteria**: System correctly restricts features by role; admins see all schools, directors see their school only, teachers see personal schedules

### Teacher Schedule Display
- **Functionality**: Comprehensive timetable viewer with tabbed interface showing complete schedule data, teacher lists (displaying Number, Name, Short Name, and Subject columns without gender), class information, subjects, and classroom assignments. **The system correctly displays schedules with proper day mapping from aSc Timetables where day IDs (1=Sunday, 2=Monday, 3=Tuesday, 4=Wednesday, 5=Thursday) are mapped to Arabic day names in the correct order.**
- **Purpose**: Provide instant access to all imported schedule data with proper Arabic text rendering and relational lookups between teachers, classes, and periods. **Ensure that schedule cells match aSc Timetables exactly - displaying each class in the correct day column and period row without any shifts or misalignment.** Teacher list displays relevant information (name, short name, subject) without gender as this is not relevant for single-gender schools.
- **Trigger**: Navigate to "عرض الجدول الكامل" section after XML upload, or select teacher from "جدول المعلمين الأسبوعي" page
- **Progression**: Section access → Data retrieval → **Day ID mapping from XML (1-5) to display order (Sunday-Thursday)** → Summary statistics cards → Tabbed interface rendering → Table displays with scrollable content → Cross-reference lookups for names/IDs → **Teacher list shows Number, Name, Short Name, Subject columns** → **Color-coded schedule cells with subject and class information** → Tooltip display on hover showing full details
- **Success criteria**: All Arabic text displays correctly; relationships between teachers, classes, subjects resolved accurately; schedule shows proper day names in Arabic **in correct order (الأحد، الاثنين، الثلاثاء، الأربعاء، الخميس)**; **schedule cells match aSc Timetables exactly without day shifts**; **teacher list displays four columns (Number, Name, Short Name, Subject) without gender column**; filterable/sortable tables; responsive mobile view; summary cards show accurate counts; **each period-day cell displays the correct class based on XML DayID mapping**; **Sunday (day=1) displays in first column, not skipped or shifted**; color-coded subjects with legend; navigation between teachers using arrow buttons

### Absence Recording & Substitute Assignment with Smart Selection and PDF Export
- **Functionality**: Log teacher absences and assign available substitute teachers for specific periods **with intelligent filtering (by subject, grade, or all teachers) and automatic adjacent period warnings**. System provides three filter modes via prominent buttons: (1) **All Teachers** (الجدول العام) - shows all available teachers in the general schedule; (2) **Same Subject** (نفس المادة) - shows only teachers teaching the same subject as absent teacher; (3) **Same Grade** (نفس الصف) - shows only teachers teaching the same grade level, **requires ClassID in XML file for each schedule entry**. **Automatic smart warning system** detects when selected substitute has a class immediately before or after the absence period and displays prominent alert: "⚠️ تنبيه: المعلم المختار لديه حصة في الحصة [X] (قبل/بعد)، يُفضَّل اختيار معلم آخر لضمان راحة المعلم." User can proceed with selection or choose different teacher based on warning. **School name field** is provided at top of page (persisted using useKV) for PDF export. **PDF export button** appears when absences exist, generating a professionally formatted PDF document that includes school name, date, table of absences with substitutes, and footer note: "⚠️ الرجاء الالتزام بجدول الحصص وعدم التأخير عن المواعيد المحددة". **When ClassID is missing from XML**, system displays clear informational message with XML example and disables "Same Grade" button with helpful tooltip directing users to preparation guide.
- **Purpose**: Maintain continuous instruction by quickly identifying optimal substitute coverage while **ensuring fair distribution and teacher wellness** through smart filtering and adjacency warnings. Prevent teacher burnout by alerting administrators when substitute assignment would result in consecutive teaching periods without break. **Provide professional printable PDF reports** for distribution to school staff with clear documentation of absence coverage and schedule adherence reminders. **Provide clear, actionable guidance** when ClassID data is missing from XML to help users understand requirements and fix their data source.
- **Trigger**: Click "غياب المعلمين" and select absent teacher, then choose filter mode; click "تصدير PDF" button to export absences
- **Progression**: Teacher selection → Date/period selection → **Filter mode button selection (All/Subject/Grade)** → **ClassID check for selected periods** → Available substitute list **filtered dynamically** → **If ClassID missing: Display amber alert with bullet points, XML example, and guidance** → Substitute selection → **Automatic adjacent period check** → **Warning display if consecutive periods detected** → User decision (continue or select different teacher) → Substitute assignment confirmation → Notification → Statistics update → **PDF Export: Click export button** → New window opens → HTML template with school name and absences table → Styled with Tajawal font → Print dialog auto-opens → User saves/prints PDF
- **Success criteria**: System shows three clearly labeled filter buttons with order (الجدول العام / نفس المادة / نفس الصف); "All Teachers" filter is displayed first and set as default; buttons use distinct icons (Users, BookOpen, GraduationCap); active filter button highlighted with primary color; substitute list updates instantly when filter changed; **system correctly identifies adjacent periods by checking period number ±1 on same day**; warning alert appears prominently below teacher selection with amber styling; warning shows specific period numbers and direction (before/after); warning persists until substitute changed or cleared; user can override warning and proceed with selection; system only shows substitutes free during that period; prevents double-booking; filter mode resets when absent teacher changed; mobile-responsive filter buttons stack vertically on small screens; warning component uses Alert UI with Warning icon; **school name input field persists value using useKV**; **PDF export button visible only when absences exist**; **PDF opens in new window with proper RTL Arabic rendering**; **PDF includes all absence records with teacher names, periods, and substitutes**; **PDF footer includes schedule adherence reminder message**; **PDF print dialog opens automatically**; **when ClassID missing: amber alert displays with enhanced formatting (bullet points, margins, XML example)**; **"Same Grade" button shows helpful tooltip explaining requirement and directing to guide**; **console warnings in Arabic with XML examples for developers**; **XML preparation guide includes prominent section with star emoji highlighting ClassID importance**; **guide explains consequences of missing ClassID and step-by-step verification instructions**

### Statistical Dashboard
- **Functionality**: Real-time analytics showing teacher counts, subject distribution, absence rates, and coverage metrics
- **Purpose**: Data-driven insights for administrative planning and resource allocation
- **Trigger**: Click "تقرير إحصائي" or view on homepage
- **Progression**: Dashboard access → Data aggregation → Chart rendering → Metric calculation → Display update
- **Success criteria**: All metrics accurate; charts render smoothly; data updates when new absences recorded; shows warnings for high absence rates

### Smart Analytics Dashboard with AI-Based Substitute Finder
- **Functionality**: Interactive analytics dashboard with three main sections: (1) **Visual Analytics** - Bar/line charts showing daily teaching loads per teacher across weekdays, with filters for individual teachers, subjects, or all teachers comparison; (2) **Smart Substitute Finder** - AI-powered system that analyzes all teachers and recommends optimal substitutes based on scoring algorithm (free in period +5, same subject +3, same grade +2, adjacent period -3, fairness consideration ±2), with filters for all teachers, same subject, or same grade; (3) **Fairness Tracking** - Progress bars showing each teacher's substitute load percentage with color coding (green <20%, yellow 20-40%, red >40%) to ensure equitable distribution of substitute duties
- **Purpose**: Provide administrators with visual insights into teaching loads, automate the complex decision-making process of finding the best substitute teacher using data-driven scoring, and ensure fair distribution of substitute duties across all teachers through transparent tracking and analytics
- **Trigger**: Click "الرسم البياني الذكي" from homepage or navigate to analytics section
- **Progression**: Page access → Tab selection (Analytics/Substitute/Fairness) → **Analytics tab**: Select teacher/subject/chart type → Chart renders with Recharts showing daily loads → Compare teachers visually | **Substitute tab**: Select day/period → Choose filter type (all/subject/grade) → System calculates scores → Displays ranked list with reasoning → Best candidate highlighted | **Fairness tab**: System calculates substitute percentages → Progress bars render → Color coding applied → Recommendations shown
- **Success criteria**: Charts render smoothly with accurate daily load calculations; all teacher names displayed correctly in Arabic; color coding matches subjects consistently; substitute finder correctly identifies teachers who are free (not in another class during that period); scoring algorithm properly weights factors (availability, subject match, grade match, adjacent periods, fairness); displays detailed reasoning for each candidate's score; highlights best candidate with badge; fairness percentages calculated accurately based on historical substitute assignments; color indicators update dynamically; mobile-responsive layout; handles edge cases (no available substitutes, all teachers busy, new teachers with no history); integrates with existing absence recording system

## Edge Case Handling

- **Malformed XML** - Display specific error message in Arabic indicating parsing failure; offer validation tips and link to preparation guide
- **Mixed/Incorrect Encoding** - **Automatically normalize any encoding to UTF-8 without BOM** before parsing; show toast notification during conversion; handle ANSI, UTF-8 with BOM, and other encodings transparently
- **Missing UTF-8 Declaration** - System handles this automatically through normalization; no longer requires manual intervention
- **Star Notation in IDs** - Automatically remove * prefix from all ID fields (id="*1" → id="1"); show warning count of cleaned IDs
- **Incorrect Day ID Mapping** - **System expects aSc Timetables day numbering where 1=Sunday, 2=Monday, 3=Tuesday, 4=Wednesday, 5=Thursday**; if XML uses 0-4 numbering, display warning and provide guidance to adjust day attributes in XML file
- **Gender Field in XML** - Gender attribute is silently ignored during parsing; system does not store or display gender information as it's not relevant for single-gender schools
- **Missing ClassID in TimeTableSchedule** - **When ClassID attribute is empty or missing** from schedule entries, "Same Grade" filter button is disabled with clear tooltip; prominent amber alert displays below filter buttons explaining requirement with bullet points, XML example code snippet, and reference to preparation guide; console warnings in Arabic guide developers; XML guide section 7 provides comprehensive explanation of consequences and verification steps
- **Duplicate Teachers** - Flag duplicates with warning showing both ID and name; continue processing but alert user
- **Missing Required Fields** - Warn when teachers/classes lack id or name attributes; skip entries but log in warnings
- **Unclosed XML Tags** - Detect parser errors and suggest checking tag closure; link to structure guide
- **Empty Schedule Section** - Warn if <TimeTableSchedules> is missing or empty; still process other sections
- **No Available Substitutes** - Show message indicating all teachers are occupied; suggest checking adjacent periods or marking as uncovered
- **Concurrent Absences** - Handle multiple teachers absent same period; show coverage priority list; allow partial assignment
- **Past Date Editing** - Warn when editing historical data; require confirmation; maintain audit trail of changes

## Design Direction

The interface should evoke feelings of professional efficiency and calm organization - reflecting the structured environment of educational institutions while maintaining approachable warmth. The design should feel trustworthy and authoritative without being intimidating, using clean layouts that reduce cognitive load for administrators making time-sensitive decisions throughout the school day. A minimal interface better serves the core purpose, keeping focus on data clarity and quick action rather than decorative elements.

## Color Selection

Triadic color scheme using educational-appropriate colors that convey trust, clarity, and organization while ensuring excellent readability for extended use.

- **Primary Color**: Deep Blue (#2563eb / oklch(0.55 0.18 264)) - Represents trust, stability, and professionalism associated with educational institutions
- **Secondary Colors**: Warm Amber (#f59e0b / oklch(0.75 0.15 70)) for accents and highlights; Soft Gray (#64748b / oklch(0.52 0.02 250)) for secondary text and borders
- **Accent Color**: Vibrant Teal (#14b8a6 / oklch(0.70 0.12 180)) - Used for success states, available periods, and active selections to draw attention without overwhelming
- **Foreground/Background Pairings**:
  - Background White (oklch(0.99 0 0)): Dark Blue-Gray text (oklch(0.25 0.02 250)) - Ratio 12.5:1 ✓
  - Card Light Gray (oklch(0.97 0 0)): Dark Blue-Gray text (oklch(0.25 0.02 250)) - Ratio 11.2:1 ✓
  - Primary Deep Blue (oklch(0.55 0.18 264)): White text (oklch(0.99 0 0)) - Ratio 7.8:1 ✓
  - Secondary Warm Amber (oklch(0.75 0.15 70)): Dark Brown text (oklch(0.30 0.05 60)) - Ratio 6.2:1 ✓
  - Accent Vibrant Teal (oklch(0.70 0.12 180)): White text (oklch(0.99 0 0)) - Ratio 5.1:1 ✓
  - Muted Light Gray (oklch(0.95 0 0)): Medium Gray text (oklch(0.50 0.02 250)) - Ratio 5.8:1 ✓

## Font Selection

Typography should convey clarity and readability in both Arabic and English contexts, with fonts that feel modern yet professional for an educational management tool. Tajawal for Arabic provides excellent legibility and professional appearance, while Inter for English/numbers ensures consistency and readability in mixed-language interfaces.

- **Typographic Hierarchy**:
  - H1 (Page Title): Tajawal Bold / 32px / -0.02em letter spacing - Main section headers like "جداول المعلمين"
  - H2 (Section Headers): Tajawal SemiBold / 24px / -0.01em - Subsection headers like teacher names
  - H3 (Card Titles): Tajawal Medium / 18px / 0em - Individual card headers and labels
  - Body (Content): Tajawal Regular / 16px / 0.01em / 1.6 line height - General text content
  - Small (Meta Info): Tajawal Regular / 14px / 0.01em - Timestamps, counts, secondary information
  - Button Text: Tajawal Medium / 16px / 0em - All interactive elements

## Animations

Animations should be purposeful and efficient - providing immediate feedback for interactions while maintaining the professional atmosphere of an administrative tool. Movements should feel responsive rather than decorative, with quick transitions that don't impede workflow during busy school operations.

- **Purposeful Meaning**: Subtle fade-ins when loading new schedule data communicate data refresh; slide transitions between different teacher views maintain spatial context
- **Hierarchy of Movement**: Priority to interactive feedback (button presses, form submissions) and status changes (absence recorded, substitute assigned); minimal animation for purely informational displays to maintain focus on content

## Component Selection

- **Components**:
  - **Dialog** - User login, new user creation, absence recording forms requiring focused input
  - **Card** - Teacher schedule displays, statistical summaries, individual absence records with subtle shadows for depth
  - **Table** - Schedule grids with responsive column sizing; bordered cells for clear period delineation; scrollable areas for large datasets
  - **Tabs** - Two-tab interface for XML upload page (رفع الملف / دليل التحضير); five-tab interface for schedule view (الجدول / المعلمون / الفصول / المواد / الغرف)
  - **Button** - Primary (upload, submit), Secondary (cancel, back, download sample), Ghost (table actions) with appropriate visual hierarchy
  - **Select** - Teacher selection, date/period pickers with search functionality for large lists
  - **Alert** - XML validation warnings (encoding, stars, gender), errors (parsing, missing fields), success messages with appropriate severity colors
  - **Badge** - Period counts, gender indicators (M/F), grade levels, day markers with color coding
  - **ScrollArea** - Scrollable table containers for large datasets (600px height) with custom scrollbar styling
  - **Separator** - Visual division between guide sections and dashboard areas
  
- **Customizations**:
  - **XML Preparation Guide** - Comprehensive 7-step tutorial with code examples, do's/don'ts comparisons, keyboard shortcuts, and downloadable sample XML
  - **Schedule Grid Component** - Custom component for displaying timetable with color-coded periods, hover tooltips showing subject details
  - **RTL Layout Wrapper** - Ensure proper right-to-left layout for Arabic interface elements throughout all pages
  - **XML Upload Zone** - Drag-and-drop area with file validation preview and direct link to preparation guide
  - **Statistics Cards** - Summary cards showing counts of teachers, classes, subjects, days, and periods with appropriate icons
  
- **States**:
  - Buttons: Subtle shadow on default, deeper shadow and scale on hover, pressed state with slight darkening, disabled state at 50% opacity
  - Inputs: Border color changes from gray to primary on focus, red border on validation error, green checkmark on successful validation
  - Schedule cells: Light background on default, highlight with teal accent on hover, deeper accent for current period, gray strikethrough for absent teacher
  
- **Icon Selection**:
  - Upload (CloudArrowUp) for file upload
  - BookOpen for preparation guide tab
  - Download for sample XML download
  - Calendar (CalendarBlank) for teacher schedules and date selection
  - UsersThree for teacher counts
  - Door for classroom/class indicators
  - Books for subjects
  - Clock for periods/time
  - User for teacher profiles
  - Warning (WarningCircle) for validation warnings
  - XCircle for errors
  - Check (CheckCircle) for successful operations and correct examples
  - List (ListBullets) for schedule table view
  - ChartBar for statistics
  - Sparkle for smart analytics and AI features
  - SignIn for login
  - House for home navigation
  
- **Spacing**: Base spacing scale of 4px (Tailwind's 1 unit); cards use p-6, buttons use px-4 py-2, sections separated by mb-8, grid gaps of gap-4
  
- **Mobile**: 
  - Schedule tables switch to card-based layout below 768px with vertical period lists
  - Navigation converts to hamburger menu with sidebar drawer
  - Forms stack vertically with full-width inputs
  - Dashboard statistics arrange in single column
  - Large touch targets (min 44px) for all interactive elements
  - Sticky header with quick actions always visible
