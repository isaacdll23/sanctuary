# Sanctuary

Sanctuary is a modern, full-stack productivity and personal management app built with React Router, TypeScript, Drizzle ORM, and Tailwind CSS. It provides a robust platform for managing tasks, finances, utilities, and more—all with a beautiful, responsive UI and a focus on user experience.

## Features

- 📝 **Task Management**: Organize, track, and complete your work with categories, steps, and filtering.
- 💸 **Finance Tracking**: Manage your income and expenses with secure, user-specific dashboards.
- ⚡ **Utilities & Commands**: Save, version, and manage custom utility commands with full version history.
- 🔒 **Authentication**: Secure user authentication and session management.
- 🛠️ **TypeScript & Drizzle ORM**: Type-safe backend and database access.
- 🎨 **Tailwind CSS**: Modern, responsive, and customizable UI.
- 🚀 **Production-Ready**: Docker support, SSR, asset optimization, and more.

## Getting Started

### Installation

Install dependencies:

```bash
npm install
```

### Development

Start the development server with HMR:

```bash
npm run dev
```

App will be available at [http://localhost:5173](http://localhost:5173).

### Building for Production

Create a production build:

```bash
npm run build
```

## Deployment

### Docker

Sanctuary includes a Dockerfile for easy containerization:

```bash
docker build -t sanctuary .
docker run -p 3000:3000 sanctuary
```

You can deploy the container to any platform that supports Docker (AWS, GCP, Azure, Railway, etc).

### Manual Deployment

Deploy the output of `npm run build`:

```
├── package.json
├── package-lock.json
├── build/
│   ├── client/    # Static assets
│   └── server/    # Server-side code
```

## Project Structure

- `app/` — Main application code
  - `components/` — Reusable UI components
  - `db/` — Database schema and access
  - `modules/` — Auth, session, and service logic
  - `routes/` — Route modules for tasks, finance, utilities, etc.
- `public/` — Static assets
- `Dockerfile` — Containerization
- `drizzle.config.ts` — Drizzle ORM config
- `vite.config.ts` — Vite build config

## Tech Stack

- **Frontend**: React 19, React Router 7, Tailwind CSS
- **Backend**: Node.js, Drizzle ORM, PostgreSQL
- **Auth**: Custom authentication with Argon2
- **Build**: Vite, TypeScript
- **Containerization**: Docker

## Styling

Sanctuary uses [Tailwind CSS](https://tailwindcss.com/) for rapid, utility-first styling. You can customize the look and feel easily.

---

Built with ❤️ by Isaac.
