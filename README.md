# OpoSupportDesk — Chat Support Manager

A fully client-side support management dashboard for forex trading platforms. Built with vanilla JavaScript, HTML5, and CSS3 following the Material Design 3 design system.

---

## Overview

OpoSupportDesk is a single-page application (SPA) that gives support teams a unified interface for managing live chats, agent shifts, platform issues, tickets, and performance reports — with no backend or build tools required.

---

## Features

### Dashboard
- Real-time overview panel showing customers online, ongoing chats, and logged-in agents
- Statistics grid: Active Chats, Agents Online, Avg. First Response, CSAT Score
- Last 7 Days SVG bar chart with live data
- Agent Status Board with per-agent load indicators
- Platform Issues widget

### Live Chats
- Active chats panel with supervise mode per conversation
- Chat queue with pick-up functionality
- Real-time queue counter

### Agent Management
- Agent grid with SVG-generated avatars (gender-aware, 12-color palette)
- Filter tabs: All, Day Shift, Night Shift, Online, Busy, Away, Offline
- Edit and add agents via modal

### Platform Issues
- Issues grid with status, priority, category, and owner
- Filter by status: To Do, In Progress, Pending, Postponed, Resolved
- Full issue detail modal with conversation history and status controls
- Create new issues; export data to Excel

### Tickets
- Split-panel layout: ticket list (left) + detail view (right)
- Status tabs: Open, Pending, On Hold, Solved, Closed
- Full conversation thread in detail panel

### Reports
- **Total Chats** — KPI cards, bar chart by period, Annual Chat Analytics with monthly distribution, MoM trend chart, and 2025 vs 2026 year-over-year comparison
- **Chat Satisfaction** — CSAT score with donut chart
- **Agent Performance** — Rankings table with multi-metric KPIs
- Date period filters: Today, Yesterday, Last 7 Days, Current Month, Last Month, Current Year, Total

### Profile
- Edit personal information and work shift
- Custom avatar upload or SVG avatar generator
- Password & security section

### Settings
- Light / Dark theme with live preview cards
- Language & Region: English, Arabic (RTL), Persian (RTL)
- 7 configurable notification toggles

### Notifications
- Full notification history with unread badge
- Mark-as-read and dropdown panel in the header

---

## Session Management

- Sessions persist in `localStorage` across page reloads
- **10-minute inactivity timeout** — a warning modal appears at 9 minutes with a 60-second countdown
- Any mouse, keyboard, scroll, or touch event resets the idle timer
- "Stay Logged In" extends the session; "Log Out Now" terminates it immediately
- Automatic logout when the countdown reaches zero

---

## Internationalization (i18n)

Three languages supported with full RTL layout for Arabic and Persian:

| Language | Code | Direction |
|---|---|---|
| English | `en` | LTR |
| Arabic | `ar` | RTL |
| Persian / Farsi | `fa` | RTL |

Language preference is persisted in `localStorage`.

---

## Design System

Built on **Material Design 3** principles:

| Token | Value |
|---|---|
| Primary | `#1a56db` |
| Surface | `#f3f4ff` |
| Card | `#ffffff` |
| On-Surface | `#1a1c22` |
| Outline Variant | `#c4c6d0` |
| Shape — Large | `16px` |
| Shape — Full (buttons) | `100px` |
| Easing | `cubic-bezier(0.2, 0, 0, 1)` |
| Font | Roboto (300 · 400 · 500 · 700) |

Dark mode uses the MD3 dark color scheme (`page-bg: #111318`, `card-bg: #1d2030`).

---

## Responsive Breakpoints

| Breakpoint | Behaviour |
|---|---|
| `≤ 1200px` | Stat grid 4 → 2 columns |
| `≤ 1024px` | Search bar narrows, tickets panel compresses |
| `≤ 800px` | Sidebar collapses to icon-only (64px) |
| `≤ 768px` | Tickets stack vertically, live chats go single-column, profile stacks |
| `≤ 600px` | Search hidden, stat grid 1-column, language cards wrap |
| `≤ 480px` | Language cards full-width, profile fields stack |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Markup | HTML5 |
| Styling | CSS3 — custom properties, grid, flexbox, MD3 |
| Logic | Vanilla JavaScript (ES6+) |
| Font | Google Fonts — Roboto |
| Storage | Browser `localStorage` |
| Charts | Inline SVG (custom, no library) |
| Backend | None — fully client-side |

---

## Project Structure

```
OpoLearningRepo/
├── index.html      # Full SPA structure (auth screens + all 9 pages)
├── app.js          # All application logic (~3 400 lines)
├── styles.css      # Complete styling with MD3 overrides (~3 700 lines)
└── README.md
```

---

## Getting Started

No build step or dependency installation required.

1. Clone the repository:
   ```bash
   git clone https://github.com/Diana-Opo/OpoLearningRepo.git
   ```
2. Open `index.html` in any modern browser.

**Demo credentials:** any valid email address and any non-empty password are accepted.

---

## Pages Reference

| Route key | Page |
|---|---|
| `dashboard` | Main dashboard (default) |
| `livechats` | Live chat supervision |
| `agents` | Agent management |
| `issues` | Platform issues |
| `tickets` | Support tickets |
| `reports` | Analytics & reports |
| `notifications` | Notification centre |
| `profile` | User profile |
| `settings` | App settings |
