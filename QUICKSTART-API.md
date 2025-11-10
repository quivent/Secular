# Secular API Quickstart

Get the Secular API running in 2 minutes.

## Option 1: Local Development (Fastest)

```bash
cd secular-api
npm install
cp .env.example .env
npm start
```

Server running at: http://localhost:5288

Test it:
```bash
curl http://localhost:5288/health
```

---

## Option 2: Docker (Recommended)

```bash
cd secular-api
docker-compose up -d
```

Server running at: http://localhost:5288

---

## Option 3: Complete Stack (API + GUI)

```bash
cd secular
docker-compose up -d
```

- GUI: http://localhost
- API: http://localhost:5288

---

## Test API

```bash
# Health check
curl http://localhost:5288/health

# System status
curl http://localhost:5288/api/system/status

# List repos
curl http://localhost:5288/api/repos

# Add friend
curl -X POST http://localhost:5288/api/friends/add \
  -H "Content-Type: application/json" \
  -d '{
    "name": "alice",
    "nid": "did:key:z6MkrLkMeYpjQZXKY8Xq",
    "repoPath": "/path/to/repo"
  }'
```

---

## Configure GUI to Use API

```bash
cd secular-gui
cp .env.local .env

# Edit .env:
# VITE_API_URL=http://localhost:5288

npm run dev
```

GUI at: http://localhost:5289

---

## Deployment Options

### Production Server
```bash
# Install PM2
npm install -g pm2

# Start API
cd secular-api
pm2 start src/server.js --name secular-api
pm2 save
pm2 startup
```

### Remote API
```bash
# On server
cd secular-api
HOST=0.0.0.0 npm start

# On GUI machine
cd secular-gui
echo "VITE_API_URL=http://YOUR_SERVER_IP:5288" > .env
npm run build
npm run preview
```

---

## Next Steps

- See [DEPLOYMENT.md](DEPLOYMENT.md) for full deployment guide
- See [secular-api/README.md](secular-api/README.md) for API documentation
- See [secular-gui/CONFIGURATION.md](secular-gui/CONFIGURATION.md) for GUI config

**Ready to go!** 🚀
