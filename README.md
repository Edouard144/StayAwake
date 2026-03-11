# StayAwake 🟢

Keep your free-tier hosted sites (Render, Railway, Glitch...) from sleeping.

Users sign up, add their site URLs with a custom ping interval, and StayAwake pings them forever — even when the browser is closed.

## Tech Stack
- **Frontend** — HTML, CSS, Vanilla JS
- **Backend** — Node.js + Express
- **Database** — NeonDB (PostgreSQL)
- **Scheduler** — node-cron

## Features
- ✅ Email & password authentication (JWT)
- ✅ Add multiple sites per account
- ✅ Custom ping interval per site (in minutes)
- ✅ Pause / resume / delete sites
- ✅ Last pinged timestamp shown on dashboard
- ✅ Pings run on server — browser can be closed

## Folder Structure
```
StayAwake/
├── backend/
│   ├── config/db.js
│   ├── controllers/authController.js
│   ├── controllers/siteController.js
│   ├── middleware/auth.js
│   ├── routes/authRoutes.js
│   ├── routes/siteRoutes.js
│   ├── scheduler/pinger.js
│   └── index.js
├── frontend/
│   ├── css/style.css
│   ├── js/auth.js
│   ├── js/dashboard.js
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   └── dashboard.html
└── README.md
```

## Setup
1. Clone the repo
2. `cd backend && npm install`
3. Create `.env` from `.env.example`
4. Run `node index.js`