# Secular GUI Configuration Guide

## Environment-Based API Configuration

The Secular GUI can be configured to connect to different API backends using environment variables.

## Quick Start

### Local Development (Default)
```bash
cp .env.local .env
npm run dev
# GUI runs on http://localhost:5289
# API runs on http://localhost:5288
```

### Production Deployment
```bash
cp .env.production .env
# Edit .env and set your API URL
VITE_API_URL=https://api.secular.example.com
npm run build
```

## Environment Files

### `.env.local` - Local Development
```bash
VITE_API_URL=http://localhost:5288
VITE_USE_LOCAL_API=true
VITE_USE_TAURI=false
VITE_ENV=development
```

### `.env.production` - Production
```bash
VITE_API_URL=https://api.secular.example.com
VITE_USE_LOCAL_API=false
VITE_USE_TAURI=false
VITE_ENV=production
```

### `.env.example` - Template
```bash
# Copy this to .env and customize
VITE_API_URL=http://localhost:5288
VITE_USE_LOCAL_API=true
VITE_USE_TAURI=false
VITE_ENV=development
```

## Configuration Options

### `VITE_API_URL`
- **Description**: URL of the Secular API server
- **Default**: `http://localhost:5288`
- **Examples**:
  - Local: `http://localhost:5288`
  - Remote: `https://api.secular.example.com`
  - Custom port: `http://192.168.1.100:8080`

### `VITE_USE_LOCAL_API`
- **Description**: Whether to use local API server
- **Default**: `true`
- **Values**: `true` | `false`

### `VITE_USE_TAURI`
- **Description**: Whether to use Tauri desktop mode
- **Default**: `false`
- **Values**: `true` | `false`

### `VITE_ENV`
- **Description**: Environment name
- **Default**: `development`
- **Values**: `development` | `production` | `staging`

## Usage in Code

### Import Config
```typescript
import { config, getApiUrl } from './config';

// Access configuration
console.log(config.apiUrl);        // http://localhost:5288
console.log(config.isDev);         // true in development
console.log(config.isProd);        // true in production

// Get full API endpoint
const url = getApiUrl('/api/system/status');
// Returns: http://localhost:5288/api/system/status
```

### Using the API Client
```typescript
import { api } from './api/client';

// All API calls automatically use configured endpoint
const status = await api.getSystemStatus();
const repos = await api.listRepos();
await api.addFriend({
  name: 'alice',
  nid: 'did:key:z6MkrLk...',
  repoPath: '/path/to/repo'
});
```

## Deployment Scenarios

### Scenario 1: Web App + Local API
**Setup**: Run both GUI and API on the same machine

```bash
# Terminal 1: Start API
cd secular-api
npm install
npm start

# Terminal 2: Start GUI
cd secular-gui
cp .env.local .env
npm install
npm run dev
```

**Access**: http://localhost:5289

---

### Scenario 2: Web App + Remote API
**Setup**: GUI connects to remote API server

```bash
# On API Server (e.g., VPS)
cd secular-api
npm install
npm start
# Accessible at https://api.secular.example.com

# On Local Machine
cd secular-gui
cp .env.production .env
# Edit .env:
# VITE_API_URL=https://api.secular.example.com
npm run build
npm run preview
```

---

### Scenario 3: Multiple Environments
**Setup**: Different configs for dev/staging/prod

```bash
# Development
cp .env.local .env
npm run dev

# Staging
cp .env.staging .env
npm run build

# Production
cp .env.production .env
npm run build
```

Create `.env.staging`:
```bash
VITE_API_URL=https://staging-api.secular.example.com
VITE_USE_LOCAL_API=false
VITE_ENV=staging
```

---

### Scenario 4: Docker Deployment
**Setup**: Both GUI and API in containers

```yaml
# docker-compose.yml
version: '3.8'
services:
  api:
    build: ./secular-api
    ports:
      - "5288:5288"
    environment:
      - PORT=5288
      - HOST=0.0.0.0

  gui:
    build: ./secular-gui
    ports:
      - "80:80"
    environment:
      - VITE_API_URL=http://api:5288
```

---

## Feature Flags

### Toggle Local vs Remote API

**Option 1: Environment Variable**
```bash
# .env
VITE_USE_LOCAL_API=false
VITE_API_URL=https://api.secular.example.com
```

**Option 2: Runtime Toggle**
```typescript
// In your app settings
const [useRemote, setUseRemote] = useState(false);

const apiUrl = useRemote
  ? 'https://api.secular.example.com'
  : 'http://localhost:5288';
```

### Toggle Tauri Mode

```bash
# Web mode
VITE_USE_TAURI=false
npm run dev

# Desktop mode
VITE_USE_TAURI=true
npm run tauri dev
```

---

## Troubleshooting

### CORS Errors
If you see CORS errors when connecting to remote API:

**Solution 1**: Configure CORS in API server
```bash
# secular-api/.env
CORS_ORIGIN=http://localhost:5289,https://secular.example.com
```

**Solution 2**: Use proxy in development
```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'https://api.secular.example.com',
        changeOrigin: true,
      }
    }
  }
});
```

### API Connection Failed
```bash
# Check if API is running
curl http://localhost:5288/health

# Check API URL in browser console
console.log(config.apiUrl);
```

### Environment Variables Not Loading
```bash
# Restart dev server after changing .env
npm run dev

# Verify variables are loaded
# In browser console:
console.log(import.meta.env.VITE_API_URL);
```

---

## Security Considerations

### Development
```bash
# .env.local - Less restrictive
VITE_API_URL=http://localhost:5288
CORS_ORIGIN=*
ENABLE_AUTH=false
```

### Production
```bash
# .env.production - More restrictive
VITE_API_URL=https://api.secular.example.com
CORS_ORIGIN=https://secular.example.com
ENABLE_AUTH=true
API_KEY=your-secret-key-here
```

### API Key Usage
```typescript
// If API requires authentication
const response = await fetch(getApiUrl('/api/system/status'), {
  headers: {
    'X-API-Key': process.env.VITE_API_KEY
  }
});
```

---

## Advanced: Multiple API Backends

Support multiple API backends with a selector:

```typescript
// src/config.ts
const API_BACKENDS = {
  local: 'http://localhost:5288',
  staging: 'https://staging-api.secular.example.com',
  production: 'https://api.secular.example.com',
};

export function setApiBackend(backend: keyof typeof API_BACKENDS) {
  localStorage.setItem('api_backend', backend);
}

export function getApiBackend() {
  const saved = localStorage.getItem('api_backend');
  return API_BACKENDS[saved as keyof typeof API_BACKENDS] || config.apiUrl;
}
```

---

## Summary

1. **Copy environment file**: `cp .env.local .env`
2. **Set API URL**: Edit `VITE_API_URL` in `.env`
3. **Run dev server**: `npm run dev`
4. **Build for production**: `npm run build`

All API calls will automatically use the configured endpoint!
