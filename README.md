# Sanctuary

A full-stack productivity platform demonstrating modern web development practices.

**Built with**: React Router 8 • TypeScript • Drizzle ORM • PostgreSQL • Tailwind CSS

<img width="2506" height="1187" alt="image" src="https://github.com/user-attachments/assets/5861217d-a17e-4bd3-87ab-bd905411645a" />

## What's Inside

- **Task Management** — Organize work with categories, steps, and intelligent filtering
- **Finance Tracking** — User-isolated income/expense dashboards with analytics
- **Command Utilities** — Versioned, searchable utility command management
- **Admin Portal** — Role-based access control with comprehensive user management
- **Google Calendar** — Two-way calendar integration for day planning
- **Real-time Notifications** — Toast system with email integration

## Architecture Highlights

- Service-layer pattern with clean separation of concerns
- Session-based authentication with role-based access control
- Type-safe database layer with migrations
- Responsive design with dark mode support
- Production-ready with Docker deployment

## Quick Start

```bash
npm install && npm run dev
```

Visit http://localhost:5173

## Testing

```bash
npm test
```

Run type checks with:

```bash
npm run typecheck
```

## Contributing

All changes should follow the repository's [coding standards](docs/CODING_STANDARDS.md). They define the architecture, TypeScript, security, database, UI, accessibility, testing, and completion requirements used for review.

## Tech Stack

- **Frontend**: React 19, React Router 8, Tailwind CSS
- **Backend**: Node.js, Drizzle ORM, PostgreSQL
- **Auth**: Custom authentication with Argon2
- **Build**: Vite, TypeScript
- **Deployment**: Docker

---

Built by Isaac
