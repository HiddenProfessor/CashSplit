<div align="center">

# CashSplit

**Self-hosted shared expense tracking for small groups.**

Split bills, track balances, and settle up — without spreadsheets or third-party services.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![SQLite](https://img.shields.io/badge/SQLite-encrypted-003B57?logo=sqlite)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker)
![License](https://img.shields.io/badge/license-GPL--3.0-blue)

</div>

---

## Features

- **Groups** — Create a group, invite existing users by email, and start splitting.
- **Expense tracking** — Log shared expenses with equal, preset percentage, or custom slider splits.
- **Live balances** — See who owes whom and get the shortest settlement plan to close the loop.
- **Payments** — Record real payments to update balances without wiping history.
- **Settle & archive** — Mark all open expenses as settled and keep them in a collapsed history.
- **Encrypted at rest** — The SQLite database is encrypted with a key you control.
- **Self-hosted** — One Docker command, one file database, no external services.

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Server Actions, Turbopack) |
| UI | React 19, Tailwind CSS 4, Lucide icons |
| Database | SQLite via libsql (encrypted at rest) |
| ORM | Prisma 6 with libsql driver adapter |
| Auth | bcryptjs + JWT sessions (httpOnly cookies) |
| Deployment | Docker / Docker Compose |

---

## Quick start with Docker (Linux)

This is a complete step-by-step guide. No prior Docker experience required.

### 1. Install Docker

If Docker is not installed yet, run this in your terminal:

```bash
curl -fsSL https://get.docker.com | sh
```

Then add your user to the `docker` group so you don't need `sudo`:

```bash
sudo usermod -aG docker $USER
```

**Log out and log back in** for the group change to take effect.

Verify it works:

```bash
docker --version
docker compose version
```

Both commands should print a version number. If they do, you're ready.

### 2. Get the code

```bash
git clone https://github.com/HiddenProfessor/CashSplit.git
cd CashSplit
```

### 3. Create the data directory

```bash
mkdir -p data
```

This is where your encrypted database will live. It persists across container restarts.

### 4. Configure secrets

Open `compose.yaml` in a text editor:

```bash
nano compose.yaml
```

Find the `environment` section and replace the placeholder values:

```yaml
environment:
  DATABASE_URL: file:./data/cashsplit.db
  SESSION_SECRET: change-this-before-public-use      # ← replace this
  ENCRYPTION_KEY: change-this-to-a-32-byte-hex-key   # ← replace this
```

To generate secure random values:

```bash
# Generate a session secret
openssl rand -base64 32

# Generate a 32-byte hex encryption key
openssl rand -hex 32
```

Copy each output and paste it into the corresponding line in `compose.yaml`. Save and close the file.

> **Important:** Keep a copy of your `ENCRYPTION_KEY`. If you lose it, the database cannot be decrypted.

### 5. Build and start

```bash
docker compose up --build -d
```

This builds the Docker image and starts the app in the background. The first build takes a few minutes.

### 6. Verify it's running

```bash
docker compose ps
```

You should see the `cashsplit` container with status `Up`. You can also check the health endpoint:

```bash
curl http://localhost:3000/api/health
```

Expected response:

```json
{"ok":true}
```

### 7. Open the app

Go to `http://YOUR_SERVER_IP:3000` in your browser.

Create your first account, then create a group and invite others.

---

## Managing the app

### View logs

```bash
docker compose logs -f
```

Press `Ctrl+C` to stop following.

### Stop the app

```bash
docker compose down
```

### Start it again

```bash
docker compose up -d
```

### Update to a new version

```bash
git pull
docker compose up --build -d
```

### Back up your data

Your entire database is one file. Copy it to keep a backup:

```bash
cp data/cashsplit.db data/cashsplit-backup-$(date +%Y%m%d).db
```

### Restore from backup

```bash
docker compose down
cp data/cashsplit-backup-YYYYMMDD.db data/cashsplit.db
docker compose up -d
```

---

## Running without Docker Compose

If you prefer plain Docker commands:

```bash
docker build -t cashsplit .

docker run -d \
  --name cashsplit \
  -p 3000:3000 \
  -e DATABASE_URL="file:./data/cashsplit.db" \
  -e SESSION_SECRET="$(openssl rand -base64 32)" \
  -e ENCRYPTION_KEY="$(openssl rand -hex 32)" \
  -v "$(pwd)/data:/app/data" \
  --restart unless-stopped \
  cashsplit
```

---

## Local development

```bash
npm install
cp .env.example .env   # or create .env manually (see below)
npm run dev
```

Create a `.env` file with:

```env
DATABASE_URL="file:./data/cashsplit.db"
SESSION_SECRET="any-dev-secret"
ENCRYPTION_KEY="any-dev-key"
```

Run database migrations:

```bash
node scripts/migrate.mjs
```

Open `http://localhost:3000`.

---

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | SQLite file path. Default: `file:./data/cashsplit.db` |
| `SESSION_SECRET` | Yes | Secret for signing JWT session tokens. Use a random string ≥ 32 characters. |
| `ENCRYPTION_KEY` | Yes | Key for SQLite encryption at rest. Use a 32-byte hex string (`openssl rand -hex 32`). |

---

## How it works

1. **Sign up** — Each person creates their own account.
2. **Create a group** — One person creates a group and invites others by email.
3. **Log expenses** — Anyone in the group adds expenses. Choose equal split, preset percentages (25/75, 50/50, 75/25), or drag custom sliders.
4. **Check balances** — The dashboard shows live balances and the shortest repayment plan.
5. **Record payments** — When money changes hands, record it. Balances update immediately.
6. **Settle up** — Mark all open expenses as settled to start a clean slate while keeping full history.

---

## Raspberry Pi

CashSplit runs on a Raspberry Pi with no changes. The Docker image uses `node:22-alpine`, which supports ARM.

```bash
docker compose up --build -d
```

For HTTPS, put the app behind a reverse proxy like Caddy or nginx.

---

## Health check

```
GET /api/health → {"ok": true}
```

---

## License

This project is licensed under the [GNU General Public License v3.0](LICENSE).
