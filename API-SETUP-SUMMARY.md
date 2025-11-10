# Secular API Setup - Complete Summary

## What Was Created

### 1. Standalone API Server (`secular-api/`)

A clean, production-ready API server extracted from the GUI:

```
secular-api/
├── src/
│   ├── server.js           # Main Express server
│   ├── routes/
│   │   ├── system.js       # System status endpoints
│   │   ├── node.js         # Node management
│   │   ├── repos.js        # Repository operations
│   │   ├── friends.js      # P2P friend management
│   │   └── cost.js         # Cost monitoring
│   └── utils/
│       └── exec.js         # Shell execution utilities
├── package.json            # Dependencies
├── .env.example            # Environment template
├── Dockerfile              # Container definition
├── docker-compose.yml      # Docker setup
├── secular-api.service     # Systemd service file
└── README.md               # API documentation
```

### 2. GUI Configuration (`secular-gui/`)

Environment-based API configuration system:

```
secular-gui/
├── src/
│   ├── config.ts           # Configuration loader
│   └── api/
│       └── client.ts       # Type-safe API client
├── .env.example            # Template
├── .env.local              # Local development
├── .env.production         # Production settings
├── Dockerfile              # GUI container
├── nginx.conf              # Web server config
└── CONFIGURATION.md        # Config documentation
```

### 3. Deployment Files

Complete deployment infrastructure:

```
secular/
├── docker-compose.yml      # Full stack (API + GUI)
├── DEPLOYMENT.md           # Comprehensive deployment guide
└── QUICKSTART-API.md       # Quick start guide
```

---

## Key Features

### ✅ Standalone API Server
- **Independent**: Runs without GUI
- **RESTful**: Clean API endpoints
- **Modular**: Organized route handlers
- **Secure**: Input validation, CORS, optional API keys
- **Production-ready**: Health checks, error handling

### ✅ Environment Configuration
- **Toggle backends**: Local vs remote API
- **Feature flags**: Enable/disable features
- **Multi-environment**: Dev, staging, production
- **Type-safe**: TypeScript config with intellisense

### ✅ Docker Support
- **API container**: Lightweight, secure
- **GUI container**: Nginx + optimized build
- **Full stack**: Both services together
- **Volume mounting**: Access to .radicle data

### ✅ Comprehensive Docs
- **9 deployment options**: From local dev to Kubernetes
- **Configuration guide**: All settings explained
- **Troubleshooting**: Common issues solved
- **API reference**: All endpoints documented

---

## Quick Start Guide

### Scenario 1: Web App (No Tauri) - Local API

**Perfect for development:**

```bash
# Terminal 1: API
cd secular-api
npm install
npm start

# Terminal 2: GUI
cd secular-gui
cp .env.local .env
npm run dev
```

Access: http://localhost:5289

### Scenario 2: Web App - Remote API

**Perfect for production with separate API server:**

```bash
# On API server (VPS, cloud, etc.)
cd secular-api
npm install
HOST=0.0.0.0 npm start

# On local machine or web hosting
cd secular-gui
echo "VITE_API_URL=http://YOUR_API_SERVER:5288" > .env
npm run build
npm run preview
```

### Scenario 3: Docker - Complete Stack

**Perfect for easy deployment:**

```bash
cd secular
docker-compose up -d
```

Access:
- GUI: http://localhost
- API: http://localhost:5288

### Scenario 4: API Only (Headless)

**Perfect for server-side automation:**

```bash
cd secular-api
npm install
npm start
```

Use with curl, Python, or any HTTP client:

```bash
curl http://localhost:5288/api/system/status
curl -X POST http://localhost:5288/api/friends/add \
  -H "Content-Type: application/json" \
  -d '{"name":"alice","nid":"did:key:z6Mk...","repoPath":"..."}'
```

---

## Architecture

```
┌─────────────────────────────────────────┐
│          Secular GUI (Frontend)         │
│   React + TypeScript + Vite + Tauri    │
│                                         │
│  Environment Config (Feature Flags):    │
│  • VITE_API_URL=http://localhost:5288  │
│  • VITE_USE_LOCAL_API=true             │
│  • VITE_USE_TAURI=false                │
└───────────────┬─────────────────────────┘
                │ HTTP REST API
                │ (Configurable endpoint)
┌───────────────▼─────────────────────────┐
│       Secular API Server (Backend)      │
│          Express + Node.js              │
│                                         │
│  Endpoints:                             │
│  • GET  /health                         │
│  • GET  /api/system/status              │
│  • POST /api/node/start                 │
│  • GET  /api/repos                      │
│  • POST /api/friends/add                │
│  • POST /api/friends/push               │
│  • ... and 12+ more                     │
└───────────────┬─────────────────────────┘
                │ Shell commands (rad, git)
                │
┌───────────────▼─────────────────────────┐
│         Radicle Heartwood Stack         │
│    radicle-node + rad CLI + git         │
│              P2P Network                │
└─────────────────────────────────────────┘
```

---

## Toggle Between Local and Remote API

### Method 1: Environment File

```bash
# Local API
cd secular-gui
echo "VITE_API_URL=http://localhost:5288" > .env

# Remote API
echo "VITE_API_URL=https://api.secular.example.com" > .env

npm run dev
```

### Method 2: Build Time

```bash
# Development build (local API)
npm run dev

# Production build (remote API)
npm run build
```

### Method 3: Runtime Config

```typescript
// In your code
import { config, getApiUrl } from './config';

// Dynamically change API endpoint
const apiUrl = useRemoteApi
  ? 'https://api.secular.example.com'
  : 'http://localhost:5288';

const url = `${apiUrl}/api/system/status`;
```

---

## API Endpoints Reference

### System
- `GET /health` - Health check
- `GET /api/system/status` - Node status, repos, peers

### Node Management
- `POST /api/node/start` - Start radicle-node
- `POST /api/node/stop` - Stop radicle-node

### Repositories
- `GET /api/repos` - List repositories
- `POST /api/repos/init` - Initialize repository
- `POST /api/repos/clone` - Clone repository
- `POST /api/repos/push` - Push changes
- `POST /api/repos/pull` - Pull changes
- `POST /api/repos/sync` - Sync repository

### Friends (P2P)
- `GET /api/friends` - List friends
- `POST /api/friends/add` - Add friend
- `DELETE /api/friends/:name` - Remove friend
- `POST /api/friends/push` - Push to friend
- `POST /api/friends/pull` - Pull from friend
- `POST /api/friends/sync` - Sync with friends

### Cost Monitoring
- `GET /api/cost/metrics` - Get cost estimates

---

## Security Features

### API Server
- ✅ Input validation (names, node IDs, paths)
- ✅ Shell escape for commands
- ✅ CORS configuration
- ✅ Optional API key authentication
- ✅ No command injection vulnerabilities

### GUI
- ✅ Environment-based configuration
- ✅ No hardcoded API URLs
- ✅ Type-safe API client
- ✅ Error handling

### Docker
- ✅ Non-root user
- ✅ Minimal base images
- ✅ Health checks
- ✅ Read-only volumes where possible

---

## Configuration Files

### API Server

**`.env`** (secular-api/.env):
```bash
PORT=5288
HOST=0.0.0.0
CORS_ORIGIN=*
ENABLE_AUTH=false
API_KEY=your-secret-key
```

### GUI

**`.env.local`** (Development):
```bash
VITE_API_URL=http://localhost:5288
VITE_USE_LOCAL_API=true
VITE_USE_TAURI=false
```

**`.env.production`** (Production):
```bash
VITE_API_URL=https://api.secular.example.com
VITE_USE_LOCAL_API=false
VITE_USE_TAURI=false
```

---

## Deployment Options Summary

| Option | Complexity | Best For |
|--------|-----------|----------|
| Local Dev | ⭐ | Development, testing |
| Docker Compose | ⭐⭐ | Production, easy deployment |
| API Only | ⭐ | Headless servers, automation |
| GUI Only | ⭐⭐ | Frontend on CDN/static host |
| Systemd | ⭐⭐ | Linux production servers |
| Cloud (GCP/AWS) | ⭐⭐⭐ | Scalable, public access |
| Nginx Reverse Proxy | ⭐⭐⭐ | Custom domains, SSL |
| Kubernetes | ⭐⭐⭐⭐ | Enterprise, orchestration |

---

## Next Steps

1. **Choose deployment option** from DEPLOYMENT.md
2. **Configure environment** using CONFIGURATION.md
3. **Test endpoints** with curl or Postman
4. **Deploy GUI** pointing to your API
5. **Set up monitoring** and backups

---

## Files Created

### Core Files
- `secular-api/src/server.js` - Main API server
- `secular-api/src/routes/*.js` - Route handlers
- `secular-api/src/utils/exec.js` - Utilities
- `secular-gui/src/config.ts` - Configuration
- `secular-gui/src/api/client.ts` - API client

### Configuration
- `secular-api/.env.example` - API config template
- `secular-gui/.env.local` - Local dev config
- `secular-gui/.env.production` - Production config

### Deployment
- `secular-api/Dockerfile` - API container
- `secular-api/docker-compose.yml` - API docker setup
- `secular-api/secular-api.service` - Systemd service
- `secular-gui/Dockerfile` - GUI container
- `secular-gui/nginx.conf` - Nginx config
- `docker-compose.yml` - Full stack

### Documentation
- `secular-api/README.md` - API docs
- `secular-gui/CONFIGURATION.md` - Config guide
- `DEPLOYMENT.md` - Full deployment guide
- `QUICKSTART-API.md` - Quick start
- `API-SETUP-SUMMARY.md` - This file

---

## Support

**Need help?**

1. Read [DEPLOYMENT.md](DEPLOYMENT.md) for detailed guides
2. Check [CONFIGURATION.md](secular-gui/CONFIGURATION.md) for config
3. See [API README](secular-api/README.md) for API docs
4. Check troubleshooting section in DEPLOYMENT.md

**Ready to deploy!** 🚀

---

**Answer to original question:** Yes! You can run this as a web app without Tauri by using the standalone API server with configurable endpoints. Toggle between local and remote APIs using environment variables. The cleanest approach (option 4) is now fully implemented with complete Docker support and comprehensive documentation.
