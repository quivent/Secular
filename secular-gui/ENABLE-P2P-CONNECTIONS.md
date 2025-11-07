# Enable P2P Connections - Quick Guide

Your Radicle node needs to accept inbound connections so friends can connect directly.

## Your Node Information

**Node ID (Share this):**
```
did:key:z6MkmVEDLxM3R58Aj4bnUpRUt8xP2WFgqtZUPseHDKcmT2tt
```

**Node Alias:** quivent

## Current Status
❌ Not listening for inbound connections (`listen: []`)

## Fix: Enable Inbound Connections

### Step 1: Stop the Node
```bash
rad node stop
```

### Step 2: Configure Listening Address

```bash
# Option A: Listen on all interfaces (easier, but less secure)
rad node config --listen 0.0.0.0:8776

# Option B: Listen on localhost only (more secure for testing)
rad node config --listen 127.0.0.1:8776

# Option C: Listen on specific external IP (most secure for production)
rad node config --listen YOUR_IP:8776
```

**Recommended:** Use Option A for P2P with friends across networks.

### Step 3: Set External Address (For Remote Friends)

If your friend is on a different network (not same LAN), configure your external IP:

```bash
# Get your public IP
curl ifconfig.me

# Configure it (replace with your actual IP)
rad node config --external-address YOUR_PUBLIC_IP:8776
```

### Step 4: Restart the Node
```bash
rad node start
```

### Step 5: Verify
```bash
rad node status
```

You should see: ✓ Node is configured to listen for inbound connections

## Firewall Configuration

### macOS
```bash
# Allow inbound on port 8776
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /path/to/radicle-node
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblock /path/to/radicle-node
```

### Linux (ufw)
```bash
sudo ufw allow 8776/tcp
```

### Router Port Forwarding (If friend is on different network)

1. Login to your router admin panel (usually http://192.168.1.1)
2. Find "Port Forwarding" or "NAT" settings
3. Forward external port 8776 → your local IP port 8776
4. Protocol: TCP

## Testing Connection

### On Your Side:
```bash
# Check if port is listening
lsof -i :8776
# or
netstat -an | grep 8776
```

### Your Friend Tests (Windows):
```powershell
# Test connection to your node
Test-NetConnection -ComputerName YOUR_PUBLIC_IP -Port 8776
```

## Quick Setup Commands

### Full Setup (Copy & Paste):
```bash
# Stop node
rad node stop

# Enable listening on all interfaces
rad node config --listen 0.0.0.0:8776

# Get and set external address
PUBLIC_IP=$(curl -s ifconfig.me)
rad node config --external-address $PUBLIC_IP:8776

# Start node
rad node start

# Verify
rad node status
```

## Share with Your Friend

Once configured, share these with your Windows friend:

1. **Your Node ID:**
   ```
   did:key:z6MkmVEDLxM3R58Aj4bnUpRUt8xP2WFgqtZUPseHDKcmT2tt
   ```

2. **Your Public IP:Port** (if on different networks):
   ```bash
   curl ifconfig.me
   # Result: YOUR_IP:8776
   ```

3. **Instructions for them:**
   - In Secular GUI, go to Friends tab
   - Click "Add Friend"
   - Name: "YourName"
   - Node ID: `did:key:z6MkmVEDLxM3R58Aj4bnUpRUt8xP2WFgqtZUPseHDKcmT2tt`
   - Click "Add Friend"

## Troubleshooting

### "Connection refused"
- Check firewall is open: `sudo ufw status` (Linux) or System Preferences → Security (macOS)
- Verify node is listening: `lsof -i :8776`
- Check router port forwarding if on different networks

### "Node not running"
```bash
rad node start
rad node status
```

### "Can't reach node"
Try:
```bash
# Check what address node is listening on
rad node config | grep listen

# Check network connectivity
ping YOUR_PUBLIC_IP
```

## Security Notes

- **Same LAN**: `--listen 0.0.0.0:8776` works fine
- **Over Internet**: Consider VPN or tailscale for security
- **Production**: Use firewall rules to limit access to known friends
- **Testing**: Start with localhost, then open gradually

## Alternative: Use Seed Nodes (No Port Forwarding)

If port forwarding is too complex, you can both connect through public seed nodes:

```bash
# You don't need to configure listen/external
# Just add each other as remotes and sync through seed nodes
rad remote add did:key:FRIEND_NID --name friend
git push friend main
```

The sync will happen through the public Radicle seed network (slower but easier).
