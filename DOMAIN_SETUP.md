# Setting Up source.oceanica.network

Map your domain to the GCP Secular server for easy access.

## Step 1: DNS Configuration

Add an A record in your domain's DNS settings:

```
Type: A
Name: source (or source.oceanica.network)
Value: 35.222.36.165
TTL: 3600 (or Auto)
```

**Where to do this:**
- If using Cloudflare: DNS > Records > Add Record
- If using Google Domains: DNS > Custom Records
- If using Namecheap: Advanced DNS > Host Records
- If using Route53: Hosted Zones > oceanica.network > Create Record

**Verification:**
```bash
# Wait 5-10 minutes after adding the record, then test:
dig source.oceanica.network
# Should show 35.222.36.165

# Or use nslookup:
nslookup source.oceanica.network
```

---

## Step 2: Server Configuration (Nginx Reverse Proxy)

SSH into your GCP server and run these commands:

```bash
# Install nginx
sudo apt update
sudo apt install -y nginx

# Create nginx config
sudo tee /etc/nginx/sites-available/secular <<'EOF'
server {
    listen 80;
    server_name source.oceanica.network;

    # Redirect to HTTPS (after SSL is set up)
    # return 301 https://$server_name$request_uri;

    location / {
        proxy_pass http://localhost:5288;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Enable the site
sudo ln -s /etc/nginx/sites-available/secular /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default 2>/dev/null || true

# Test configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## Step 3: Open Firewall Ports

```bash
# On GCP, allow HTTP/HTTPS traffic
gcloud compute firewall-rules create allow-http-https \
  --allow tcp:80,tcp:443 \
  --source-ranges 0.0.0.0/0 \
  --target-tags http-server,https-server \
  --description="Allow HTTP and HTTPS traffic"

# Tag the instance
gcloud compute instances add-tags secular-node \
  --zone=us-central1-a \
  --tags=http-server,https-server
```

---

## Step 4: SSL/HTTPS with Let's Encrypt (Recommended)

Once DNS is propagated (5-10 minutes):

```bash
# Install certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate (automatic nginx configuration)
sudo certbot --nginx -d source.oceanica.network

# Follow prompts:
# - Enter email address
# - Agree to terms
# - Choose whether to redirect HTTP to HTTPS (recommended: Yes)

# Certbot will automatically:
# 1. Get SSL certificate
# 2. Update nginx config
# 3. Set up auto-renewal
```

**Test auto-renewal:**
```bash
sudo certbot renew --dry-run
```

---

## Step 5: Verify

After DNS propagates and nginx is configured:

```bash
# Test HTTP
curl -I http://source.oceanica.network

# Test HTTPS (after SSL setup)
curl -I https://source.oceanica.network

# Or visit in browser:
# http://source.oceanica.network
```

---

## Quick Commands

**Check nginx status:**
```bash
sudo systemctl status nginx
```

**View nginx logs:**
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

**Reload nginx config:**
```bash
sudo nginx -t && sudo systemctl reload nginx
```

**Check SSL certificate:**
```bash
sudo certbot certificates
```

---

## Summary

1. ✅ Add DNS A record: `source.oceanica.network` → `35.222.36.165`
2. ✅ Install nginx on GCP server
3. ✅ Configure reverse proxy (port 80 → 5288)
4. ✅ Open firewall ports (80, 443)
5. ✅ Get SSL certificate with certbot
6. ✅ Access at https://source.oceanica.network

**Estimated time:** 15 minutes (mostly waiting for DNS)
