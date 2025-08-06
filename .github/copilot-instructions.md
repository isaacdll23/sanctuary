# Sanctuary AI Coding Instructions

## Project Overview

Sanctuary is a React Router v7 full-stack productivity app with TypeScript, Drizzle ORM (PostgreSQL), and Tailwind CSS. It provides task management, finance tracking, notes, utilities, and admin functionality with role-based access control.

## Core Architecture Patterns

### Authentication & Authorization

- **Session-based auth**: Use `app/modules/auth.server.ts` functions (`requireAuth`, `getUserFromSession`, `isUserAdmin`)
- **Page access control**: Wrap route loaders/actions with middleware:
  - `pageAccessLoader("pageId", loaderFn)` - checks user has access to specific pages
  - `adminOnlyLoader(loaderFn)` - admin-only routes
  - Users have `allowedPages` JSON array field; admins bypass all restrictions

### Route Protection Pattern

```typescript
// Standard protected route
export const loader = pageAccessLoader("tasks", async (user, request) => {
  // user is already authenticated and authorized
  return { data };
});

// Admin-only route
export const loader = adminOnlyLoader(async (adminUser, request) => {
  // adminUser is guaranteed to be admin
  return { data };
});
```

### Service Layer Architecture

- **Services directory**: `app/modules/services/` contains business logic
- **Service pattern**: Each domain has a service (TaskService, NoteService, PageAccessService)
- **Action handlers**: Services export `handle[Domain]Action(request)` functions that parse form data and route to specific actions based on `intent` field

### Database Patterns

- **Schema**: Single file at `app/db/schema.ts` with Drizzle tables
- **Imports**: Use dynamic imports in loaders/actions for server-only code
- **Relations**: Foreign keys with `.references()`, user isolation with `userId` fields

### Component Organization

- **Route components**: In `app/routes/` with co-located types via `+types/[route].ts`
- **Shared components**: Domain-organized in `app/components/[domain]/`
- **Layout components**: Sidebar navigation with role-based filtering

## Key Development Workflows

### Adding New Routes

1. Add route to `app/routes.ts`
2. Create route file with `meta`, `loader`, `action`, and default export
3. Use appropriate middleware (`pageAccessLoader` or `adminOnlyLoader`)
4. Add page to sidebar navigation in `Sidebar.tsx` with `pageId`
5. Update `PageAccessService.ts` with new page ID for admin access control

### Form Handling Pattern

All forms use `intent` field for action routing:

```typescript
// In component
<fetcher.Form method="post">
  <input type="hidden" name="intent" value="createTask" />
  {/* other fields */}
</fetcher.Form>;

// In service
if (intent === "createTask") {
  // handle creation
  return { success: true, message: "Created" };
}
```

### Database Operations

- Always filter by `userId` for data isolation
- Use transactions for related operations (e.g., task + steps)
- Follow pattern: insert/update -> return success/error object


## Styling & UI Conventions

- **Tailwind classes**: Use only gray color classes for backgrounds, text, and borders, always paired with `dark:` variants for dark mode support. Do not use any `slate-*` classes.
  - **Backgrounds**: Use `bg-gray-100 dark:bg-gray-700` for surfaces, `bg-white dark:bg-gray-900` for main containers, and `bg-white/80 dark:bg-gray-800/80` for overlays.
  - **Text**: Use `text-gray-900 dark:text-gray-100` for primary text, `text-gray-500 dark:text-gray-400` for secondary text, and similar patterns for headings and labels.
  - **Borders**: Use `border-gray-300 dark:border-gray-700` or `border-gray-300 dark:border-gray-600` as appropriate.
  - **Never use**: `bg-slate-*`, `text-slate-*`, `border-slate-*`, or any slate color classes.
- **Responsive design**: Mobile-first with `md:` breakpoints
- **Loading states**: Use `fetcher.state === "submitting"` for button states
- **Modals**: Fixed overlays with `backdrop-blur` and scale animations, always using theme-aware backgrounds and borders
- **Icons**: Always use Hero Icons from `@heroicons/react/24/outline` instead of manually drawn SVGs
  - Import icons: `import { IconName } from "@heroicons/react/24/outline"`
  - Usage: `<IconName className="w-6 h-6" />`
  - Never draw custom SVG icons when Hero Icons equivalents exist

## Common Commands

```bash
npm run dev          # Development server
npm run build        # Production build
npm run typecheck    # Type checking
npx drizzle-kit push # Database migrations
```


## Error Patterns to Avoid

- Don't use direct database imports in components (use loaders/actions)
- Don't bypass middleware - always use `pageAccessLoader`/`adminOnlyLoader`
- Don't forget `userId` filtering in database queries
- Don't mix server-only imports with client code (use dynamic imports in loaders)
- **Never use any `slate-*` Tailwind classes**. All color styling must use gray + dark: variants as described above.

## Testing Data Flow

- Forms submit to route actions via fetcher
- Actions call service handlers with parsed form data
- Services return structured response objects
- Components react to fetcher.data for success/error states
- Toast notifications for user feedback via ToastContext
