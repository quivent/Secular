# Secular API Server

Standalone REST API server for Secular - P2P Code Collaboration

## Quick Start

```bash
cd secular-api
npm install
cp .env.example .env
npm start
```

Server runs on `http://0.0.0.0:5288`

## API Endpoints

### System
- `GET /health` - Health check
- `GET /api/system/status` - System status (node, repos, peers)

### Node Management
- `POST /api/node/start` - Start radicle-node
- `POST /api/node/stop` - Stop radicle-node

### Repositories
- `GET /api/repos` - List all repositories
- `POST /api/repos/init` - Initialize new repository
- `POST /api/repos/clone` - Clone repository
- `POST /api/repos/push` - Push to repository
- `POST /api/repos/pull` - Pull from repository
- `POST /api/repos/sync` - Sync repository
- `GET /api/repos/inspect` - Inspect repository
- `POST /api/repos/seed` - Seed repository

### Friends (P2P Remotes)
- `GET /api/friends?repoPath=<path>` - List friends
- `POST /api/friends/add` - Add friend
- `DELETE /api/friends/:name?repoPath=<path>` - Remove friend
- `POST /api/friends/push` - Push to friend
- `POST /api/friends/pull` - Pull from friend
- `POST /api/friends/sync` - Sync with friends

### Cost Monitoring
- `GET /api/cost/metrics` - Get cost metrics

## Configuration

Environment variables (`.env`):

```bash
# Server
PORT=5288
HOST=0.0.0.0

# Security
CORS_ORIGIN=*
API_KEY=your-api-key-here
ENABLE_AUTH=false

# Radicle
RAD_HOME=~/.radicle
```

## Security

### API Key Authentication

Enable with `ENABLE_AUTH=true`:

```bash
curl -H "X-API-Key: your-api-key-here" http://localhost:5288/api/system/status
```

### CORS Configuration

Set specific origins:

```bash
CORS_ORIGIN=http://localhost:5289,https://secular.example.com
```

## Deployment

### Local Development
```bash
npm run dev  # Auto-reload on changes
```

### Production
```bash
npm start
```

### Docker
```bash
docker build -t secular-api .
docker run -p 5288:5288 secular-api
```

### Systemd Service
```bash
sudo cp secular-api.service /etc/systemd/system/
sudo systemctl enable secular-api
sudo systemctl start secular-api
```

## Example Usage

### JavaScript/TypeScript
```javascript
const API_URL = 'http://localhost:5288';

// Get system status
const status = await fetch(`${API_URL}/api/system/status`).then(r => r.json());

// Add friend
await fetch(`${API_URL}/api/friends/add`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'alice',
    nid: 'did:key:z6MkrLk...',
    repoPath: '/path/to/repo'
  })
});

// Push to friend
await fetch(`${API_URL}/api/friends/push`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    friendName: 'alice',
    repoPath: '/path/to/repo'
  })
});
```

### cURL
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
  -d '{"name":"alice","nid":"did:key:z6MkrLk...","repoPath":"/path/to/repo"}'

# Push to friend
curl -X POST http://localhost:5288/api/friends/push \
  -H "Content-Type: application/json" \
  -d '{"friendName":"alice","repoPath":"/path/to/repo"}'
```

## License

MIT OR Apache-2.0
