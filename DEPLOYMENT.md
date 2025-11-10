# Secular Deployment Guide

Complete guide for deploying Secular with standalone API and configurable GUI.

## Architecture Overview

```
┌─────────────────┐
│   Secular GUI   │  (React + Vite)
│  Port: 5289/80  │  Configurable API endpoint
└────────┬────────┘
         │ HTTP/HTTPS
         │
┌────────▼────────┐
│  Secular API    │  (Express + Node.js)
│   Port: 5288    │  Executes rad commands
└────────┬────────┘
         │ Shell
         │
┌────────▼────────┐
│  Radicle Node   │  (radicle-node daemon)
│      P2P        │  Manages git repos
└─────────────────┘
```

## Deployment Options

### 1. Local Development (Fastest Start)

**Best for**: Testing, development, single-user

```bash
# Terminal 1: Start API
cd secular-api
npm install
cp .env.example .env
npm start

# Terminal 2: Start GUI
cd secular-gui
npm install
cp .env.local .env
npm run dev
```

**Access**:
- GUI: http://localhost:5289
- API: http://localhost:5288

---

### 2. Docker Compose (Recommended)

**Best for**: Production, easy deployment, multi-container

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/secular.git
cd secular

# Build and start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

**Access**:
- GUI: http://localhost
- API: http://localhost:5288

**Stop**:
```bash
docker-compose down
```

---

### 3. API Server Only

**Best for**: Headless server, API access only

```bash
cd secular-api
npm install
cp .env.example .env

# Edit .env
nano .env
# Set: HOST=0.0.0.0

# Start server
npm start

# Or with PM2 (production)
npm install -g pm2
pm2 start src/server.js --name secular-api
pm2 save
pm2 startup
```

**Access**: http://YOUR_SERVER_IP:5288

---

### 4. GUI Only (Remote API)

**Best for**: Separate frontend deployment

```bash
cd secular-gui
npm install

# Configure remote API
cp .env.production .env
nano .env
# Set: VITE_API_URL=https://api.secular.example.com

# Build
npm run build

# Serve with nginx or any static host
npm install -g serve
serve -s dist -p 80
```

---

### 5. Systemd Service

**Best for**: Linux servers, production

**Install API as service**:

```bash
# Install dependencies
cd /opt
git clone https://github.com/YOUR_USERNAME/secular.git
cd secular/secular-api
npm install --production

# Create user
sudo useradd -r -s /bin/false secular

# Copy service file
sudo cp secular-api.service /etc/systemd/system/

# Edit service file if needed
sudo nano /etc/systemd/system/secular-api.service

# Start service
sudo systemctl enable secular-api
sudo systemctl start secular-api

# Check status
sudo systemctl status secular-api

# View logs
sudo journalctl -u secular-api -f
```

---

### 6. Cloud Deployment (GCP/AWS/Azure)

#### Google Cloud Platform

```bash
# Create VM
gcloud compute instances create secular-api \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --machine-type=e2-micro \
  --zone=us-central1-a

# SSH into instance
gcloud compute ssh secular-api

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git

# Clone and setup
git clone https://github.com/YOUR_USERNAME/secular.git
cd secular/secular-api
npm install
cp .env.example .env

# Start with PM2
npm install -g pm2
pm2 start src/server.js --name secular-api
pm2 startup
pm2 save

# Configure firewall
gcloud compute firewall-rules create secular-api \
  --allow tcp:5288 \
  --source-ranges 0.0.0.0/0
```

#### AWS EC2

```bash
# Launch EC2 instance (t3.micro or t4g.micro)
# Ubuntu 22.04 LTS

# SSH into instance
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git

# Clone and setup (same as GCP above)
git clone https://github.com/YOUR_USERNAME/secular.git
cd secular/secular-api
npm install
npm start

# Configure Security Group to allow port 5288
```

#### DigitalOcean

```bash
# Create Droplet (Basic $6/month)
# Choose Ubuntu 22.04

# SSH into droplet
ssh root@YOUR_DROPLET_IP

# Install Node.js (same as above)
# Clone and setup (same as above)

# Configure firewall
ufw allow 5288/tcp
ufw enable
```

---

### 7. Reverse Proxy with Nginx

**Best for**: Production with custom domain

```bash
# Install nginx
sudo apt install nginx

# Create nginx config
sudo nano /etc/nginx/sites-available/secular
```

```nginx
server {
    listen 80;
    server_name secular.example.com;

    # GUI
    location / {
        proxy_pass http://localhost:5289;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # API
    location /api {
        proxy_pass http://localhost:5288;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/secular /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Add SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d secular.example.com
```

---

### 8. Docker Swarm (Multi-Node)

**Best for**: High availability, load balancing

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml secular

# Scale services
docker service scale secular_secular-api=3

# Check services
docker service ls
docker stack ps secular
```

---

### 9. Kubernetes

**Best for**: Enterprise, orchestration

```yaml
# secular-k8s.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: secular-api
spec:
  replicas: 2
  selector:
    matchLabels:
      app: secular-api
  template:
    metadata:
      labels:
        app: secular-api
    spec:
      containers:
      - name: secular-api
        image: secular/api:latest
        ports:
        - containerPort: 5288
        env:
        - name: PORT
          value: "5288"
---
apiVersion: v1
kind: Service
metadata:
  name: secular-api
spec:
  selector:
    app: secular-api
  ports:
  - port: 5288
    targetPort: 5288
  type: LoadBalancer
```

```bash
kubectl apply -f secular-k8s.yaml
kubectl get services
```

---

## Configuration Matrix

| Deployment Type | API Location | GUI Location | Best For |
|----------------|-------------|-------------|----------|
| Local Dev | localhost:5288 | localhost:5289 | Development |
| Docker Compose | Container | Container | Production |
| API Only | Server:5288 | N/A | Headless |
| GUI Only | Remote | localhost | Frontend |
| Systemd | Server:5288 | nginx | Production |
| Cloud | VM:5288 | CDN/nginx | Scale |

---

## Environment Variables Quick Reference

### API Server (.env)
```bash
PORT=5288                    # API port
HOST=0.0.0.0                # Listen address
CORS_ORIGIN=*               # Allowed origins
ENABLE_AUTH=false           # API key auth
API_KEY=secret              # API key (if auth enabled)
```

### GUI (.env)
```bash
VITE_API_URL=http://localhost:5288   # API endpoint
VITE_USE_LOCAL_API=true              # Local/remote toggle
VITE_USE_TAURI=false                 # Desktop mode
VITE_ENV=development                 # Environment
```

---

## Security Checklist

### Production Deployment
- [ ] Enable API key authentication (`ENABLE_AUTH=true`)
- [ ] Set specific CORS origin (not `*`)
- [ ] Use HTTPS (SSL/TLS)
- [ ] Configure firewall rules
- [ ] Use non-root user
- [ ] Enable rate limiting
- [ ] Set up monitoring and logging
- [ ] Regular security updates
- [ ] Backup .radicle directory
- [ ] Use environment variables for secrets

### Nginx Security Headers
```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

---

## Monitoring

### Health Checks
```bash
# API health
curl http://localhost:5288/health

# System status
curl http://localhost:5288/api/system/status
```

### Logging
```bash
# Docker logs
docker-compose logs -f secular-api

# Systemd logs
sudo journalctl -u secular-api -f

# PM2 logs
pm2 logs secular-api
```

### Prometheus Metrics (Future)
```bash
# Add to API server
GET /metrics
```

---

## Troubleshooting

### API Not Starting
```bash
# Check if port is in use
lsof -i :5288
netstat -tuln | grep 5288

# Check logs
npm start 2>&1 | tee api.log
```

### GUI Can't Connect to API
```bash
# Verify API is running
curl http://localhost:5288/health

# Check CORS configuration
# In browser console:
console.log(import.meta.env.VITE_API_URL);

# Test from GUI host
curl -H "Origin: http://localhost:5289" http://localhost:5288/api/system/status
```

### Docker Issues
```bash
# Rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Check container logs
docker-compose logs secular-api
docker-compose logs secular-gui
```

---

## Performance Tuning

### API Server
```bash
# Increase Node.js memory
NODE_OPTIONS="--max-old-space-size=4096" npm start

# Use clustering
pm2 start src/server.js -i max
```

### GUI
```bash
# Build optimized
npm run build -- --mode production

# Analyze bundle
npm install -g vite-bundle-analyzer
vite-bundle-analyzer
```

---

## Backup & Recovery

### Backup Radicle Data
```bash
# Backup .radicle directory
tar -czf radicle-backup-$(date +%Y%m%d).tar.gz ~/.radicle

# Backup configuration
cp secular-api/.env secular-api/.env.backup
```

### Restore
```bash
# Restore .radicle
tar -xzf radicle-backup-20250110.tar.gz -C ~/

# Restore configuration
cp secular-api/.env.backup secular-api/.env
```

---

## Next Steps

1. Choose deployment option above
2. Configure environment variables
3. Set up monitoring and logging
4. Configure backups
5. Test all endpoints
6. Set up CI/CD (optional)

**Need help?** See [CONFIGURATION.md](secular-gui/CONFIGURATION.md) for detailed config guide.
