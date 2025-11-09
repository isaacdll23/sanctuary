# Sanctuary AI Coding Instructions

## Project Overview

Sanctuary is a React Router v7 full-stack productivity app with TypeScript, Drizzle ORM (PostgreSQL), and Tailwind CSS. It provides task management, finance tracking, notes, utilities, and admin functionality with role-based access control.

## Core Architecture Patterns

### Authentication & Authorization

- **Session-based auth**: Use `app/modules/auth.server.ts` functions:
  - `requireAuth(request)` - throws redirect if not authenticated
  - `getUserFromSession(request)` - returns authenticated user
  - `isUserAdmin(request)` - checks if user is admin
  - `isSessionCreated(request)` - boolean check for active session
  - `refreshGoogleAccessToken(user)` - refreshes Google OAuth tokens
- **Page access control**: Wrap route loaders/actions with middleware from `app/modules/middleware/`:
  - `pageAccessLoader("pageId", loaderFn)` - checks user has access to specific page
  - `pageAccessAction("pageId", actionFn)` - protects actions with page access checks
  - `adminOnlyLoader(loaderFn)` - admin-only routes (throws redirect for non-admins)
  - `adminOnlyAction(actionFn)` - admin-only actions
  - `requirePageAccess(request, "pageId", redirectPath?)` - manual page access check
  - `requireAdminUser(request, redirectPath?)` - manual admin check
- **Access control logic**: Users have `allowedPages` JSON array field; admins bypass all restrictions
  - Access checked via `PageAccessService.hasPageAccess(userId, pageId)`

### Route Protection Pattern

```typescript
// Standard protected route with page access control
export const loader = pageAccessLoader("tasks", async (user, request) => {
  // user is already authenticated and authorized for tasks page
  return { data };
});

export const action = pageAccessAction("tasks", async (user, request) => {
  // Protected action - handles form submissions
  return { success: true };
});

// Admin-only route
export const loader = adminOnlyLoader(async (adminUser, request) => {
  // adminUser is guaranteed to be admin, unauthenticated users are redirected
  return { data };
});

export const action = adminOnlyAction(async (adminUser, request) => {
  // Admin-only action handler
  return { success: true };
});
```

### Service Layer Architecture

- **Services directory**: `app/modules/services/` contains all business logic, one service per domain
- **Core services**:
  - `TaskService.ts` - Task CRUD, task steps, reminders, category management
  - `NoteService.ts` - Note CRUD, folder management, AI title generation, encryption
  - `DayPlannerService.ts` - Day plan CRUD, task scheduling, time conflict detection, Google Calendar auto-sync
  - `SharedBudgetService.ts` - Collaborative budget management with member roles and permissions
  - `GoogleCalendarService.ts` - Two-way Google Calendar integration, event sync, conflict detection
  - `DashboardService.ts` - Analytics, user task/budget/note aggregation, insights calculation
  - `NotificationService.ts` - Email notifications via Resend
  - `PageAccessService.ts` - Page access control, admin access management
  - `UserManagementService.ts` - Admin user management, user editing
  - `ProfileService.ts` - User profile updates, settings
  - `BudgetInviteService.ts` - Budget invitation link generation and validation
  - `DashboardFeatureAccessService.ts` - Feature flag/widget access control
  - Supporting services: `NoteEncryptionService.ts`, `TokenEncryptionService.ts`, `GoogleCalendarApiClient.ts`

- **Service pattern - Intent-based action handlers**:
  - Each service exports `handle[Domain]Action(request, providedFormData?)` that parses form data
  - Routes to specific internal functions based on `intent` field from FormData
  - Returns structured response: `{ success: boolean, message?: string, error?: string, [dynamicData]? }`
  - Example TaskService intents: `createTask`, `updateTaskDetails`, `completeTask`, `incompleteTask`, `deleteTask`, `addStep`, `completeStep`, `deleteStep`, `updateCategory`, `setTaskReminder`
  - Example NoteService intents: `createNote`, `updateNote`, `autoSaveNote`, `deleteNote`, `createFolder`, `deleteFolder`, `moveNoteToFolder`, `generateNoteTitle`
  - Example DayPlannerService intents: `createOrUpdatePlan`, `createTask`, `updateTask`, `deleteTask`, `toggleTaskComplete`, `moveTask`, `deletePlan`
  - Example SharedBudgetService intents: `createBudget`, `addTransaction`, `deleteTransaction`, `addMember`, `removeMember`, `updateMemberRole`

- **Dynamic imports in loaders/actions**:
  - Always use dynamic imports for server-only services to avoid client bundle bloat
  - Pattern: `const { handleTaskAction } = await import("~/modules/services/TaskService")`
  - This allows tree-shaking and keeps service code server-only

- **Response handling in components**:
  - Components receive fetcher.data containing structured response
  - Check `response.success` to determine if action succeeded
  - Access error messages via `response.error` or `response.message`
  - Services may return additional data (e.g., created entity, updated lists)
  - Use ToastContext for user feedback based on response status

### Database Patterns

- **Schema**: Single file at `app/db/schema.ts` with all Drizzle ORM tables
  - Tables: users, sessions, tasks, taskSteps, notes, folders, budgets, budgetMembers, budgetTransactions, dayPlans, dayPlanSections, utilities_commands, googleCalendarAccounts, calendarPreferences, etc.
  - All user-specific tables include `userId` foreign key for data isolation
  - Join tables use explicit foreign key references with `.references()`
  - Timestamps use `.defaultNow()` for created/updated tracking

- **Dynamic imports for server-only code**:
  - Always use dynamic imports in loaders/actions to prevent exposing db code to client
  - Pattern: `const { db } = await import("~/db")`
  - Services already handle this internally, so components don't need direct db imports

- **Data isolation and security**:
  - **Critical**: Always filter queries by `userId` for user-specific data
  - Use `.where(eq(table.userId, userId))` or `.where(and(eq(table.userId, userId), ...))`
  - Admin users may bypass isolation for administrative operations, but ensure explicit admin checks
  - Never return sensitive data without user validation

- **Transaction patterns**:
  - Use transactions for related multi-table operations (e.g., creating task + inserting initial steps)
  - Pattern: `await db.transaction(async (tx) => { ... })`
  - Ensures atomicity - all succeed or all rollback together

- **Service responsibilities** (not direct component access):
  - Services own all database queries and transactions
  - Services validate user permissions before db operations
  - Services handle encryption/decryption (NoteService, TokenEncryptionService)
  - Services manage complex business logic (e.g., time conflicts in DayPlannerService, budget member roles in SharedBudgetService)
  - Components receive processed data only, never execute db operations directly

### Component Organization

- **Route components**: In `app/routes/` organized by domain:
  - `routes/tasks/` - Task management routes
  - `routes/notes/` - Note management routes
  - `routes/day-planner/` - Calendar and planning routes
  - `routes/finance/` - Budget and transaction routes
  - `routes/utilities/` - Command utilities routes
  - `routes/admin/` - Admin portal routes
  - `routes/auth/` - Authentication routes
  - `routes/settings.tsx`, `routes/dashboard.tsx`, `routes/home.tsx` - Core pages
  - **Co-located types**: Type definitions in `+types/[route].ts` files adjacent to route files

- **Shared components**: Domain-organized in `app/components/[domain]/`:
  - `tasks/` - TaskModal, TaskStep, TaskTableView, TaskTableHeader, TaskTableDesktop, TaskTableMobile, etc.
  - `day-planner/` - CalendarView, AddTaskModal, EditTaskModal, ConflictResolutionModal, DayInsightsPanel, DayPlannerContent, DayPlannerHeader, GoogleCalendarButton, QuickAddTaskBar, QuickUpcomingTasksSidebar, EmptyPlanState, etc.
  - `finance/` - SharedBudgetCard, BudgetProgressBar, transaction components, member management components
  - `notes/` - Note editor, folder browser, search components
  - `admin/` - UserEditModal, UserRow, UserTableDesktop, UserTableMobile, UserTableHeader, EmailForm, PageAccessManager, StatCard, etc.
  - `dashboard/` - DashboardStatCard, DashboardFilterControls, DashboardNotificationCenter, FeatureCard, FeatureGrid, ProductivityInsightsCard, QuickAccessShortcuts, widgets/, etc.
  - `toast/` - Toast notification system components
  - `sidebar/` - Navigation sidebar components
  - `settings/` - Settings management components
  - `utilities/` - Utility command components

- **Component responsibilities**:
  - Components are UI-only, never directly access database
  - Fetch data via route loaders, always authenticated and access-controlled
  - Submit forms to route actions using `fetcher.Form` with `intent` field
  - Handle presentation logic, state management for UI, and response handling
  - Components receive processed data from loaders/actions
  - Use ToastContext for user feedback based on action responses

- **Layout components**: 
  - Sidebar navigation with role-based filtering in `Sidebar.tsx`
  - Shows pages user has access to based on `user.allowedPages` or admin status
  - Page IDs used in sidebar must match IDs in `pageAccessLoader` and `PageAccessService`

## Key Development Workflows

### Adding New Routes

1. Add route to `app/routes.ts` with path and path-matching syntax
2. Create route file in appropriate `app/routes/[domain]/` subdirectory with:
   - `meta` export for page title/description
   - `loader` export using `pageAccessLoader("pageId", loaderFn)` or `adminOnlyLoader(loaderFn)`
   - `action` export using `pageAccessAction("pageId", actionFn)` or `adminOnlyAction(actionFn)`
   - Default export component that renders the page
3. Add page to sidebar navigation in `Sidebar.tsx` with `pageId` and visibility logic
4. Register new page ID in `PageAccessService.ts` for access control
5. Update admin default page access in `UserManagementService.ts` if applicable

### Form Handling Pattern

All forms use `intent` field for action routing:

```typescript
// In component - using fetcher
const fetcher = useFetcher<typeof action>();

return (
  <fetcher.Form method="post">
    <input type="hidden" name="intent" value="createTask" />
    <input name="title" />
    <button type="submit">Create</button>
  </fetcher.Form>
);

// Handle response
useEffect(() => {
  if (fetcher.data?.success) {
    showToast("Task created!");
    closeModal();
  }
}, [fetcher.data?.success]);
```

```typescript
// In route action
export const action = pageAccessAction("tasks", async (user, request) => {
  const { handleTaskAction } = await import("~/modules/services/TaskService");
  const response = await handleTaskAction(request);
  return response;
});

// In service
export async function handleTaskAction(request: Request) {
  const formData = await request.formData();
  const intent = formData.get("intent");
  
  switch (intent) {
    case "createTask":
      return await createTask(formData, user.id);
    case "updateTaskDetails":
      return await updateTaskDetails(formData);
    // ... more cases
  }
}

// Response structure
return {
  success: true,
  message: "Task created successfully",
  // optional data
  task: createdTask,
  tasks: allUserTasks,
};
```

### Database Operations

- Always filter by `userId` for data isolation in all queries
- Use `eq(table.userId, userId)` or `and(eq(table.userId, userId), ...)` 
- Example: `await db.select().from(tasksTable).where(eq(tasksTable.userId, userId))`
- For related operations (e.g., task + steps), use transactions:
  ```typescript
  await db.transaction(async (tx) => {
    const [task] = await tx.insert(tasksTable).values({...}).returning();
    await tx.insert(taskStepsTable).values({taskId: task.id, ...});
  });
  ```
- Return response objects: `{ success: boolean, error?: string, message?: string, ...data }`

### Modal & Form State Management

- **Form submission tracking**: Use `lastSubmitTime` state to prevent stale response issues
  - Set `lastSubmitTime = Date.now()` when user clicks submit
  - Only process responses if `lastSubmitTime > 0`
  - Reset to 0 after handling response
- **Modal reopening**: Always reset internal state when new item is selected
  - Reset editable fields, edit modes, and form visibility
  - This prevents old data from persisting when reopening
- **Fetcher data clearing**: `fetcher.data` persists across modal open/close cycles
  - Add `lastSubmitTime` check to prevent auto-closing on stale data
- **Example**: See `UserEditModal.tsx` and `TaskModal.tsx` for reference implementations


## Styling & UI Conventions

- **Tailwind classes**: Use only gray color classes for backgrounds, text, and borders, always paired with `dark:` variants for dark mode support. Do not use any `slate-*` classes.
  - **Backgrounds**: Use `bg-gray-100 dark:bg-gray-700` for surfaces, `bg-white dark:bg-gray-900` for main containers, and `bg-white/80 dark:bg-gray-800/80` for overlays.
  - **Text**: Use `text-gray-900 dark:text-gray-100` for primary text, `text-gray-500 dark:text-gray-400` for secondary text, and similar patterns for headings and labels.
  - **Borders**: Use `border-gray-300 dark:border-gray-700` or `border-gray-300 dark:border-gray-600` as appropriate.
  - **Primary buttons**: `bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900` for main actions
  - **Secondary buttons**: `bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100` for cancel/secondary actions
  - **Never use**: `bg-slate-*`, `text-slate-*`, `border-slate-*`, or any slate color classes.
- **Responsive design**: Mobile-first with `md:` breakpoints for layout changes
- **Loading states**: Use `fetcher.state === "submitting"` for button states and input disabling
- **Button accessibility**: Minimum height of `min-h-[40px]` for touch targets, focus rings with `focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600`
- **Modals**: Fixed overlays with `backdrop-blur-sm` and scale animations, always using theme-aware backgrounds and borders
- **Icons**: Always use Hero Icons from `@heroicons/react/24/outline` instead of manually drawn SVGs
  - Import icons: `import { IconName } from "@heroicons/react/24/outline"`
  - Usage: `<IconName className="w-6 h-6" />`
  - Never draw custom SVG icons when Hero Icons equivalents exist
- **Shadows**: Subtle shadows on cards (`shadow-sm`), increased on hover for depth (`hover:shadow-md`)

## Common Commands

```bash
npm run dev          # Development server
npm run build        # Production build
npm run typecheck    # Type checking
npx drizzle-kit push # Database migrations
```


## Error Patterns to Avoid

- **Database in components**: Don't use direct database imports in components - always use loaders/actions and services
- **Bypassing middleware**: Don't skip `pageAccessLoader`/`adminOnlyLoader` - all routes must use appropriate middleware
- **Missing userId filtering**: Don't forget `userId` filtering in database queries - causes data leaks across users
- **Server-only imports in client code**: Don't mix server-only imports with client code - use dynamic imports in loaders/actions
- **Stale fetcher data**: Components should check `lastSubmitTime` to avoid responding to stale fetcher responses
- **Direct db imports in services called from routes**: Services should import db internally, routes shouldn't import db directly
- **Not handling encryption**: NoteService and TokenEncryptionService must be used for sensitive data - don't store plaintext
- **Breaking existing intent names**: Service intent names are part of the public API - coordinate before renaming
- **Never use any `slate-*` Tailwind classes** - all color styling must use gray + dark: variants as described below
- **Missing response structure**: Service responses must include `success: boolean` - other fields are optional but recommended

## Advanced Features & Integrations

### Note Encryption
- **NoteService** uses `NoteEncryptionService` for AES-256-GCM encryption
- All note content is encrypted by default with metadata tracking version and algorithm
- Backward compatible with unencrypted legacy notes - automatically detected and handled
- `bulkEncryptAllNotes()` available for admin retroactive encryption of legacy notes
- Decryption happens transparently in `getNotes()` and `getNote()` helper functions

### Google Calendar Integration
- **GoogleCalendarService** provides two-way sync with Google Calendar
- Auto-sync triggered when day planner tasks are created/updated
- Uses **GoogleCalendarApiClient** for API interactions
- Tokens encrypted via **TokenEncryptionService** for security
- Calendar sync status and conflicts returned in action responses
- **DayPlannerService** handles conflict detection and resolution

### Shared Budget Management
- **SharedBudgetService** supports role-based member access (owner, viewer, contributor)
- Budget invitations use **BudgetInviteService** for secure link-based access
- Budgets can be created by users and shared with other users
- Member roles control transaction creation and deletion permissions
- Budgets accessible to both creators and invited members

### Dashboard & Analytics
- **DashboardService** aggregates user data: tasks, budgets, notes for analytics
- **DashboardFeatureAccessService** manages feature flags for widget visibility
- Productivity insights calculated from completed tasks, budgets, notes over time
- Dashboard filters support date ranges and category filtering

### Email Notifications
- **NotificationService** sends emails via Resend
- Used for task reminders, budget alerts, notifications
- Pattern: `sendNotification(userId, type, data)` with type-specific templates

## Testing Data Flow

- Forms submit to route actions via fetcher with `intent` field
- Actions use appropriate middleware (`pageAccessLoader`/`adminOnlyLoader`) for auth
- Actions dynamically import and call service handlers: `const { handle[Domain]Action } = await import(...)`
- Service handlers parse FormData, validate permissions, execute db operations
- Services return structured response: `{ success, message?, error?, ...data? }`
- Components check `fetcher.data?.success` and display results via ToastContext
- For modals: verify `lastSubmitTime` before processing to avoid stale responses