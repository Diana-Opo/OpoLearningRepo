# OpoSupportDesk

A full-stack support dashboard for a forex brokerage. Support agents and managers can supervise live chats, manage tickets, track platform issues, and monitor agent performance — all from a single-page interface.

---

## Table of Contents

1. [How the Project is Organized](#1-how-the-project-is-organized)
2. [Tech Stack — What and Why](#2-tech-stack--what-and-why)
3. [How the Backend Works](#3-how-the-backend-works)
4. [How the Database Works](#4-how-the-database-works)
5. [How the Frontend Works](#5-how-the-frontend-works)
6. [Setting Up Locally (Step by Step)](#6-setting-up-locally-step-by-step)
7. [NPM Scripts](#7-npm-scripts)
8. [All API Endpoints](#8-all-api-endpoints)
9. [API Response Format](#9-api-response-format)
10. [User Roles and Permissions](#10-user-roles-and-permissions)
11. [Session Management](#11-session-management)
12. [Migrations — How Database Changes Work](#12-migrations--how-database-changes-work)
13. [Troubleshooting](#13-troubleshooting)

---

## 1. How the Project is Organized

```
OpoLearningRepo/
│
├── frontend/                   ← Everything the browser loads
│   ├── index.html              ← The one HTML file. All pages and modals live here.
│   ├── app.js                  ← All JavaScript logic (navigation, API calls, rendering)
│   └── styles.css              ← All CSS styling
│
└── backend/                    ← The server (Node.js)
    ├── server.js               ← Entry point — starts the server, registers all routes
    ├── .env                    ← Your secret config (NOT committed to Git)
    ├── .env.example            ← Template showing which variables are needed
    │
    ├── prisma/
    │   ├── schema.prisma       ← Defines the database tables and their columns
    │   ├── seed.js             ← Creates the first admin user in the database
    │   └── migrations/         ← Every database change, saved as SQL files
    │
    ├── routes/                 ← Defines which URL paths exist
    │   ├── auth.js
    │   ├── agents.js
    │   ├── tickets.js
    │   ├── platformIssues.js
    │   ├── users.js
    │   └── health.js
    │
    └── controllers/            ← The actual logic for each route
        ├── authController.js
        ├── agentsController.js
        ├── ticketsController.js
        ├── platformIssuesController.js
        ├── usersController.js
        └── healthController.js
```

> **Routes vs Controllers — what's the difference?**
> A **route** is just a map: "when someone calls `GET /api/agents`, run this function."
> A **controller** is where that function lives and does its work (reads from the database, validates input, sends back a response).
> Splitting them keeps the code organized and easy to find.

---

## 2. Tech Stack — What and Why

| Layer | Technology | What it does |
|---|---|---|
| Frontend | HTML, CSS, Vanilla JavaScript | Renders the UI in the browser. No framework — just plain JS. |
| Backend | Node.js 22 + Express 5 | Runs the server that handles API requests |
| ORM | Prisma 5 | Lets you write JavaScript instead of raw SQL to talk to the database |
| Database | PostgreSQL 17 | Stores all persistent data (users, agents, tickets, issues, comments) |
| Password hashing | bcrypt | Turns plain-text passwords into secure hashes before saving them |
| Environment config | dotenv | Loads `.env` file variables into `process.env` at startup |
| Cross-origin requests | cors | Allows the browser (on port 8080) to talk to the server (on port 3000) |

---

## 3. How the Backend Works

### Entry point — `server.js`

This is the first file Node.js runs. It does four things:

1. Loads environment variables from `.env` (via `dotenv`)
2. Creates the Express app
3. Enables CORS so the frontend can make requests to the backend
4. Registers all routes under `/api/...`

```
Browser → http://localhost:3000/api/agents
           ↓
         server.js sees the path starts with /api/agents
           ↓
         routes/agents.js decides which controller function to call
           ↓
         controllers/agentsController.js runs the logic and responds
```

### The `lib/prisma.js` file

This file creates one shared `PrismaClient` instance and exports it. All controllers import from here so the app only ever opens one database connection.

```js
// lib/prisma.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
module.exports = prisma;
```

### The `ok` and `fail` helpers

Every controller has two small helper functions at the top:

```js
function ok(res, data, message = 'Success', status = 200) {
  return res.status(status).json({ success: true, data, message });
}

function fail(res, message, status = 400) {
  return res.status(status).json({ success: false, data: null, message });
}
```

`ok()` sends a successful response. `fail()` sends an error response. Both use the same shape (`success`, `data`, `message`) so the frontend always knows what to expect. See [API Response Format](#9-api-response-format).

### Prisma error codes

Controllers catch specific Prisma error codes to return helpful messages:

| Code | Meaning | Example response |
|---|---|---|
| `P2002` | Unique constraint failed | "An agent with this email already exists" |
| `P2025` | Record not found | "Record not found" (404) |

---

## 4. How the Database Works

### Schema (`prisma/schema.prisma`)

The schema file is the source of truth for the database structure. Every table is defined as a `model`, and every allowed value for a column is defined as an `enum`.

#### Enums

Enums restrict what values a column can hold. For example, an agent's status can only ever be one of these:

```
AgentStatus: online | busy | away | offline | archived
```

Other enums:

| Enum | Values |
|---|---|
| `UserRole` | `agent`, `manager`, `admin` |
| `UserStatus` | `approved`, `pending`, `rejected` |
| `TicketStatus` | `open`, `in_progress`, `resolved`, `closed`, `archived` |
| `IssueStatus` | `investigating`, `identified`, `monitoring`, `resolved`, `archived` |
| `Priority` | `low`, `medium`, `high`, `urgent` |
| `Shift` | `day`, `night` |

#### Models (database tables)

**`User`** — people who log in to the dashboard

| Column | Type | Notes |
|---|---|---|
| `id` | Int | Auto-incremented primary key |
| `name` | String | Full display name |
| `email` | String | Must be unique |
| `passwordHash` | String? | bcrypt hash of the password (never stored in plain text) |
| `role` | UserRole | Defaults to `agent` |
| `status` | UserStatus | Defaults to `pending` — must be set to `approved` before login works |
| `avatarData` | String? | Base64 image or SVG string |
| `createdAt` | DateTime | Set automatically when the record is created |

**`Agent`** — support agents shown in the dashboard

| Column | Type | Notes |
|---|---|---|
| `id` | Int | Auto-incremented primary key |
| `name` | String | |
| `email` | String | Must be unique |
| `shift` | Shift | `day` or `night` |
| `status` | AgentStatus | Current availability. `archived` hides from active lists |
| `createdAt` | DateTime | |
| `modifiedAt` | DateTime | Updated automatically every time the record changes |

**`Ticket`** — support tickets from clients

| Column | Type | Notes |
|---|---|---|
| `id` | Int | |
| `subject` | String | Brief description of the issue |
| `clientEmail` | String | Email of the client who opened the ticket |
| `status` | TicketStatus | Defaults to `open` |
| `priority` | Priority | Defaults to `medium` |
| `assignedTo` | Int? | Optional FK → `Agent.id` |
| `createdAt` | DateTime | |

**`PlatformIssue`** — technical issues with trading platforms (MT5, cTrader, etc.)

| Column | Type | Notes |
|---|---|---|
| `id` | Int | |
| `title` | String | |
| `platform` | String | e.g. `mt5`, `ctrader` |
| `priority` | Priority | |
| `status` | IssueStatus | Defaults to `investigating` |
| `summary` | String | One-line summary |
| `description` | String? | Full details (stored as Text — no length limit) |
| `reportedBy` | Int? | Optional FK → `User.id` |
| `createdAt` | DateTime | |
| `modifiedAt` | DateTime | Auto-updated on every change |

**`PlatformIssueComment`** — comments left on a platform issue

| Column | Type | Notes |
|---|---|---|
| `id` | Int | |
| `issueId` | Int | FK → `PlatformIssue.id`. Deleting the issue also deletes all its comments (`onDelete: Cascade`). |
| `authorName` | String | Name of the person who wrote the comment |
| `text` | String | The comment body (Text — no length limit) |
| `createdAt` | DateTime | |

#### Relationships at a glance

```
User ──────────────────────────── PlatformIssue
  (one user can report many issues)

Agent ─────────────────────────── Ticket
  (one agent can be assigned many tickets)

PlatformIssue ─────────────────── PlatformIssueComment
  (one issue can have many comments; comments are deleted when the issue is deleted)
```

### Seed (`prisma/seed.js`)

The seed file creates the first admin user so you have someone to log in as. It is safe to run multiple times — it checks whether the user already exists before creating them.

Default admin credentials:
- **Email:** `diana@opofinance.com`
- **Password:** `Admin@1234`

---

## 5. How the Frontend Works

The frontend is a **Single-Page Application (SPA)**. There is only one HTML file (`index.html`). Every "page" (Dashboard, Tickets, Agents, etc.) is actually a `<div>` that gets shown or hidden by JavaScript. The browser never navigates to a new URL.

### Key concepts in `app.js`

**`API_BASE`** — the base URL for all API calls. If you change the backend port, update this constant.
```js
const API_BASE = 'http://localhost:3000/api';
```

**`currentUser`** — the logged-in user object, stored in `localStorage` so it survives page refreshes.

**Page navigation** — every page is a `<div id="page-{name}">`. Clicking a nav item calls `showPage('agents')` which hides all pages and shows only the one that matches.

**Data flow for an API-backed page (e.g. Agents):**
```
showPage('agents')
  → loadAgentsFromAPI()          ← fetch() to GET /api/agents
    → agents = json.data         ← store in a module-level variable
      → renderAgents()           ← build HTML strings and inject into the DOM
```

**Translation system** — every piece of text that needs to appear in English, Arabic, or Persian has a `data-i18n="key"` attribute in the HTML. When the language changes, `applyTranslations()` loops over all those elements and replaces their text with the correct value from the `translations` object in `app.js`.

**Theme** — light/dark preference is saved in `localStorage` and applied on every page load.

---

## 6. Setting Up Locally (Step by Step)

### Prerequisites

- **Node.js 22+** — download from [nodejs.org](https://nodejs.org)
- **PostgreSQL 17** — download from [postgresql.org](https://www.postgresql.org)

To check your installed versions:
```bash
node -v
psql --version
```

---

### Step 1 — Clone the repository

```bash
git clone https://github.com/Diana-Opo/OpoLearningRepo.git
cd OpoLearningRepo
```

---

### Step 2 — Create the PostgreSQL database

Open a PostgreSQL shell:
```bash
psql -U postgres
```

Then run these SQL commands (replace `your_password` with a real password):
```sql
CREATE USER dashboard_user WITH PASSWORD 'your_password';
CREATE DATABASE dashboard_db OWNER dashboard_user;
ALTER USER dashboard_user CREATEDB;
\q
```

> **What this does:**
> - Creates a dedicated database user called `dashboard_user`
> - Creates a database called `dashboard_db` owned by that user
> - Grants the user permission to create databases (needed for Prisma migrations)

---

### Step 3 — Configure environment variables

```bash
cd backend
cp .env.example .env
```

Open `.env` and fill in your values:

```
DATABASE_URL="postgresql://dashboard_user:your_password@localhost:5432/dashboard_db"
PORT=3000
FRONTEND_URL="http://localhost:8080"
```

> **What each variable does:**
> - `DATABASE_URL` — tells Prisma how to connect to PostgreSQL
> - `PORT` — the port the Express server listens on
> - `FRONTEND_URL` — used for CORS. Must match the address you use to open the frontend in your browser

---

### Step 4 — Install dependencies

```bash
cd backend
npm install
```

This downloads all the packages listed in `package.json` into a `node_modules` folder.

---

### Step 5 — Run database migrations

```bash
npm run migrate
```

> **What this does:**
> Prisma reads `schema.prisma`, compares it to the current state of the database, generates SQL, and runs it. This creates all the tables. It also runs `prisma generate` which builds the Prisma Client (the JS code you use to query the database).

---

### Step 6 — Seed the database (create the admin user)

```bash
npm run seed
```

This creates the default admin account: `diana@opofinance.com` / `Admin@1234`.

---

### Step 7 — Start the backend

```bash
npm run dev
```

You should see: `Server running on http://localhost:3000`

To verify it's working, open `http://localhost:3000/api/health` in your browser. You should see:
```json
{ "status": "ok", "database": "connected" }
```

---

### Step 8 — Serve the frontend

Open a **new terminal** (keep the backend running in the first one):

```bash
cd frontend
python3 -m http.server 8080
```

Then open `http://localhost:8080` in your browser.

Log in with:
- **Email:** `diana@opofinance.com`
- **Password:** `Admin@1234`

---

## 7. NPM Scripts

Run these from the `backend/` directory:

| Command | What it does |
|---|---|
| `npm run dev` | Starts the server with auto-restart on file changes (uses Node's built-in `--watch`) |
| `npm start` | Starts the server without auto-restart |
| `npm run migrate` | Applies pending migrations and regenerates the Prisma Client |
| `npm run generate` | Regenerates the Prisma Client without running migrations (useful after manual schema edits) |
| `npm run seed` | Creates the default admin user |
| `npm run studio` | Opens Prisma Studio — a visual database browser in your browser |

---

## 8. All API Endpoints

### Auth

| Method | Path | Who can call it | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Anyone | Create a new user account |
| `POST` | `/api/auth/login` | Anyone | Sign in and get back the user object |

### Agents

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/agents` | List all non-archived agents |
| `GET` | `/api/agents/archived` | List all archived agents |
| `POST` | `/api/agents` | Create a new agent |
| `PUT` | `/api/agents/:id` | Update an agent (partial update — only send the fields you want to change) |
| `DELETE` | `/api/agents/:id` | Permanently delete an agent |

### Tickets

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/tickets` | List all tickets (includes the assigned agent's details) |
| `POST` | `/api/tickets` | Create a new ticket |
| `PUT` | `/api/tickets/:id` | Update a ticket |
| `DELETE` | `/api/tickets/:id` | Delete a ticket |

### Platform Issues

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/platform_issues` | List all platform issues (includes reporter's name) |
| `POST` | `/api/platform_issues` | Create a new issue |
| `PUT` | `/api/platform_issues/:id` | Update an issue |
| `DELETE` | `/api/platform_issues/:id` | Delete an issue |
| `GET` | `/api/platform_issues/:id/comments` | Get all comments for an issue (oldest first) |
| `POST` | `/api/platform_issues/:id/comments` | Add a comment to an issue |

### Users (admin only for most endpoints)

| Method | Path | Who can call it | Description |
|---|---|---|---|
| `GET` | `/api/users/staff` | Anyone logged in | List all approved users (used for dropdowns) |
| `GET` | `/api/users/all` | Admin only | List all users with status and join date |
| `PATCH` | `/api/users/avatar` | Any user | Update your own avatar |
| `PATCH` | `/api/users/role` | Admin only | Change a user's role |
| `PATCH` | `/api/users/edit` | Admin only | Edit a user's name, email, role, or status |

### Health

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Checks if the server and database are up |

---

## 9. API Response Format

Every single response from the API — success or error — follows the same shape:

```json
{
  "success": true,
  "data": { ... },
  "message": "Agent created successfully"
}
```

| Field | Type | Description |
|---|---|---|
| `success` | boolean | `true` if the request worked, `false` if it failed |
| `data` | object / array / null | The actual result. `null` on errors or when there's nothing to return |
| `message` | string | Human-readable description of what happened |

**HTTP status codes used:**

| Code | Meaning |
|---|---|
| `200` | Success |
| `201` | Created (a new record was made) |
| `400` | Bad request (e.g. a required field is missing) |
| `401` | Unauthorized (wrong password) |
| `403` | Forbidden (you don't have permission) |
| `404` | Not found |
| `409` | Conflict (e.g. email already in use) |
| `500` | Server/database error |

**Example: creating an agent**

Request:
```bash
POST /api/agents
Content-Type: application/json

{
  "name": "Sara Chen",
  "email": "sara.c@example.com",
  "shift": "day",
  "status": "online"
}
```

Success response (`201`):
```json
{
  "success": true,
  "data": {
    "id": 5,
    "name": "Sara Chen",
    "email": "sara.c@example.com",
    "shift": "day",
    "status": "online",
    "createdAt": "2026-04-18T10:00:00.000Z",
    "modifiedAt": "2026-04-18T10:00:00.000Z"
  },
  "message": "Agent created successfully"
}
```

Error response (`400` — missing field):
```json
{
  "success": false,
  "data": null,
  "message": "Field email is required"
}
```

---

## 10. User Roles and Permissions

| Role | Can do |
|---|---|
| `agent` | Log in, view dashboard, manage own profile |
| `manager` | Everything an agent can do, plus manage tickets, issues, and agents |
| `admin` | Everything a manager can do, plus view and edit all users, change roles |

When a user registers, their `status` is set to `pending` by default. An admin must change it to `approved` before the user can log in. This is done through the User Management page in the dashboard.

---

## 11. Session Management

- When you log in, your user object is saved in `localStorage` in the browser
- You stay logged in across page refreshes until you log out or the session times out
- **Inactivity timeout:** if you don't interact with the page for 10 minutes, you are automatically logged out
- A warning popup appears at the 9-minute mark with a countdown, giving you a chance to stay logged in
- The idle timer is also stored in `localStorage` so it persists through page refreshes

---

## 12. Migrations — How Database Changes Work

A **migration** is a saved record of a change made to the database schema (e.g. adding a column, creating a table, adding a new enum value).

Every migration is a folder inside `backend/prisma/migrations/`, named with a timestamp and a description:

```
migrations/
├── 20260417100919_init_schema/         ← Created all tables from scratch
├── 20260417160318_role_agent_manager/  ← Added manager role
├── 20260417230550_add_avatar_data/     ← Added avatarData column to users
├── 20260418100000_add_user_status/     ← Added status column to users
├── 20260418200000_add_archived_ticket_status/
├── 20260418201000_add_archived_issue_status/
├── 20260418202000_add_archived_agent_status/
└── 20260418203000_add_platform_issue_comments/ ← Created the comments table
```

Each folder contains one `migration.sql` file with the raw SQL that was run.

**Why this matters:** If another developer clones this project and runs `npm run migrate`, Prisma runs all the SQL files in order and their database ends up in exactly the same state as yours.

> **Never edit a migration file after it has been applied.** If you need to change the database, add a new migration.

---

## 13. Troubleshooting

**`Cannot connect to database`**
- Make sure PostgreSQL is running: `brew services start postgresql` (Mac) or `sudo service postgresql start` (Linux)
- Double-check the `DATABASE_URL` in your `.env` file

**`Port 3000 already in use`**
- Another process is using port 3000. Either stop it, or change `PORT` in `.env` to something else (e.g. `3001`) and update `API_BASE` in `frontend/app.js` to match

**`Prisma Client not found` or `@prisma/client did not initialize yet`**
- Run `npm run generate` inside the `backend/` folder

**Frontend shows a blank screen or can't load data**
- Open the browser developer console (F12 → Console tab) and check for errors
- Make sure the backend is running and accessible at `http://localhost:3000/api/health`
- Check that `FRONTEND_URL` in `.env` matches exactly where you're serving the frontend from

**User can log in but sees no data**
- Make sure migrations have been applied: `npm run migrate`
- Make sure the seed ran: `npm run seed`
