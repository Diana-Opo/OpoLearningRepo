# OpoSupportDesk

A full-stack forex brokerage support dashboard. Support agents and managers can supervise live chats, manage tickets, track platform issues, and monitor agent performance — all from a single-page interface.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript (ES6+) |
| Backend | Node.js 22, Express 5 |
| ORM | Prisma 5 |
| Database | PostgreSQL 17 |
| Auth | bcrypt password hashing |
| Font | Google Fonts — Roboto |

---

## Project Structure

```
OpoLearningRepo/
├── frontend/
│   ├── index.html      # SPA shell — auth screens, 9 pages, all modals
│   ├── app.js          # All client-side logic
│   └── styles.css      # MD3-based design system
└── backend/
    ├── server.js               # Express entry point
    ├── .env.example            # Environment variable template
    ├── prisma/
    │   ├── schema.prisma       # Database models and enums
    │   └── migrations/         # SQL migration history
    ├── routes/                 # Express routers
    └── controllers/            # Business logic handlers
```

---

## Prerequisites

- **Node.js 22+** — [nodejs.org](https://nodejs.org)
- **PostgreSQL 17** — [postgresql.org](https://www.postgresql.org)

---

## Running Locally

### 1. Clone the repo

```bash
git clone https://github.com/Diana-Opo/OpoLearningRepo.git
cd OpoLearningRepo
```

### 2. Set up PostgreSQL

Create a database and user (only needs to be done once):

```sql
CREATE USER dashboard_user WITH PASSWORD 'your_password';
CREATE DATABASE dashboard_db OWNER dashboard_user;
ALTER USER dashboard_user CREATEDB;
```

### 3. Configure environment variables

```bash
cd backend
cp .env.example .env
```

Edit `.env` and fill in your real values:

```
DATABASE_URL="postgresql://dashboard_user:your_password@localhost:5432/dashboard_db"
PORT=3000
FRONTEND_URL="http://localhost:8080"
```

### 4. Install backend dependencies and run migrations

```bash
cd backend
npm install
npm run migrate   # applies migrations and generates Prisma client
```

### 5. Start the backend server

```bash
npm run dev   # auto-restarts on file changes
```

The API will be available at `http://localhost:3000`.

### 6. Serve the frontend

From the repo root, open a second terminal:

```bash
cd frontend
python3 -m http.server 8080
```

Then open `http://localhost:8080` in your browser.

> **Note:** `API_BASE` in `frontend/app.js` is set to `http://localhost:3000/api`. If you change the backend port, update that constant too.

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/auth/register` | Create an account |
| POST | `/api/auth/login` | Sign in |
| GET/POST | `/api/agents` | List / create agents |
| GET/PUT/DELETE | `/api/agents/:id` | Read / update / delete an agent |
| GET/POST | `/api/tickets` | List / create tickets |
| GET/PUT/DELETE | `/api/tickets/:id` | Read / update / delete a ticket |
| GET/POST | `/api/platform_issues` | List / create platform issues |
| GET/PUT/DELETE | `/api/platform_issues/:id` | Read / update / delete an issue |

All responses follow the shape `{ success, data, message }`.

---

## Features

### Dashboard
- Overview stats: active chats, agents online, avg. first response, CSAT
- SVG bar charts (last 7 days, current month)
- Agent status board and platform issues widget

### Live Chats
- Active chats with supervise mode
- Chat queue with urgency indicators and pick-up action
- Manager internal notes injected into transcripts

### Agent Management
- Agent grid with SVG avatars (gender-aware, 12-colour palette)
- Filter by shift (day/night) and status (online/busy/away/offline)
- Add, edit, and delete agents — all backed by the REST API

### Platform Issues
- Grid view with priority, status, platform icon, and impact metrics
- Filter by status: To Do, In Progress, Pending, Postponed, Resolved
- Detail modal with colour-coded timeline and comment thread
- Create, edit, and delete issues via the API

### Tickets
- Split-panel layout: list + conversation detail
- Status tabs: Open, Pending, On Hold, Solved, Closed
- Full message thread with client, agent, and internal note roles
- Add, edit, and delete tickets via the API

### Reports
- Chat volume, CSAT, and agent performance KPIs
- Bar charts, donut charts, and trend lines (inline SVG, no library)
- Date filters: Today → All Time; year-over-year comparison

### Profile & Settings
- Avatar upload or SVG selector
- Light/Dark theme toggle
- Language switcher: English, Arabic (RTL), Persian (RTL)

---

## Session Management

- Sessions persist in `localStorage` across page refreshes
- **10-minute inactivity timeout** — warning at 9 minutes with countdown
- Idle timer is preserved through refreshes via `localStorage`

---

## Database Models

| Model | Key fields |
|---|---|
| `User` | id, name, email, passwordHash, role |
| `Agent` | id, name, email, shift, status |
| `Ticket` | id, subject, clientEmail, status, priority, assignedTo |
| `PlatformIssue` | id, title, platform, priority, status, summary, description, reportedBy |
