-- Users table
CREATE TABLE users (
  id          SERIAL PRIMARY KEY,
  email       VARCHAR(255) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,   -- hashed with bcrypt
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Sites table
CREATE TABLE sites (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER REFERENCES users(id) ON DELETE CASCADE,
  url           VARCHAR(500) NOT NULL,
  interval_min  INTEGER NOT NULL,      -- user's custom interval in minutes
  is_active     BOOLEAN DEFAULT true,  -- user can pause/resume
  last_pinged   TIMESTAMP,             -- last time pinger ran
  created_at    TIMESTAMP DEFAULT NOW()
);
```

---

## How The Pieces Talk To Each Other
```
[Frontend]  →  POST /api/auth/register  →  [Backend]  →  saves user to NeonDB
[Frontend]  →  POST /api/auth/login     →  [Backend]  →  returns JWT token
[Frontend]  →  POST /api/sites          →  [Backend]  →  saves site + interval
[Frontend]  →  GET  /api/sites          →  [Backend]  →  returns user's sites

[Scheduler] runs every 1 minute (always on, independent of any user)
    → reads all active sites from NeonDB
    → checks if (now - last_pinged) >= interval_min
    → if yes → pings the URL → updates last_pinged