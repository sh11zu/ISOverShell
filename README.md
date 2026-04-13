# ISOverShell

A modern web-based SSH session manager for your homelab. Open terminal sessions directly in the browser with a clean, PuTTY-inspired feature set.

![Stack](https://img.shields.io/badge/stack-Node.js%20%7C%20React%20%7C%20xterm.js-6366f1)
![License](https://img.shields.io/badge/license-MIT-22c55e)

## Features

- **Browser SSH terminals** — full xterm.js terminal emulation (xterm-256color)
- **Multi-tab sessions** — open several hosts simultaneously, switch between tabs
- **Right-click to paste** — PuTTY-style clipboard behaviour
- **Host management** — save hosts with label, hostname, port, username, auth method
- **SSH Key & Password auth** — both supported per host
- **Groups & Tags** — organise hosts into folders and tag them
- **Session history** — connection timestamps and durations tracked automatically
- **Dark theme** — built-in dark UI with Dracula theme available for the terminal
- **Docker-ready** — single `docker compose up --build` deployment

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite + TypeScript + Tailwind CSS v4 |
| Terminal | xterm.js v5 (fit, web-links addons) |
| State | Zustand + TanStack Query |
| Backend | Fastify v5 + TypeScript |
| SSH | ssh2 |
| Real-time | WebSocket (ws) |
| Database | SQLite (better-sqlite3) |
| Deployment | Docker + docker-compose |

## Project structure

```
ISOverShell/
├── apps/
│   ├── frontend/          # React + Vite
│   │   └── src/
│   │       ├── components/
│   │       │   ├── Sidebar.tsx
│   │       │   └── Terminal/
│   │       │       ├── XTerm.tsx        # xterm.js wrapper
│   │       │       └── TerminalArea.tsx # tab manager
│   │       ├── pages/
│   │       │   ├── Dashboard.tsx        # host grid + add modal
│   │       │   └── Settings.tsx
│   │       └── stores/sessions.ts       # open terminal tabs (Zustand)
│   └── backend/           # Fastify + SSH proxy
│       └── src/
│           ├── db/index.ts              # SQLite + auto-migrations
│           ├── routes/
│           │   ├── hosts.ts             # CRUD hosts
│           │   └── groups.ts            # CRUD groups
│           └── ws/terminal.ts           # WebSocket → SSH bridge
├── packages/
│   └── types/             # Shared TypeScript types
├── data/                  # SQLite database (git-ignored)
├── Dockerfile
└── docker-compose.yml
```

## Getting started

### Development

```bash
git clone https://github.com/you/isovershell.git
cd isovershell

npm install

cp .env.example .env
# Edit JWT_SECRET in .env

npm run dev
# Frontend → http://localhost:5173
# Backend  → http://localhost:3001
```

### Production (Docker)

```bash
cp .env.example .env
# Set a strong JWT_SECRET and NODE_ENV=production in .env

docker compose up --build -d
# App → http://localhost:3001
```

### Deploy to a Linux server

```bash
# On the server
git clone https://github.com/you/isovershell.git
cd isovershell
cp .env.example .env && nano .env   # set JWT_SECRET

docker compose up --build -d
```

For updates:
```bash
git pull && docker compose up --build -d
```

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | HTTP port |
| `DATABASE_PATH` | `./data/isovershell.db` | SQLite file path |
| `JWT_SECRET` | — | **Required.** Secret for JWT signing |
| `NODE_ENV` | `development` | Set to `production` in Docker |

## API

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/hosts` | List all hosts |
| `POST` | `/api/hosts` | Create a host |
| `PATCH` | `/api/hosts/:id` | Update a host |
| `DELETE` | `/api/hosts/:id` | Delete a host |
| `GET` | `/api/groups` | List all groups |
| `POST` | `/api/groups` | Create a group |
| `WS` | `/ws/terminal/:hostId` | Open SSH terminal session |

## Roadmap

- [ ] Credential encryption (AES-256)
- [ ] Authentication (login / JWT)
- [ ] Terminal theme selector (Dracula, Nord, Solarized…)
- [ ] Session history view
- [ ] Host import/export (JSON)
- [ ] SSH jump hosts / tunnels
- [ ] SFTP file browser

## License

MIT
