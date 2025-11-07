# Security Assessment - Secular GUI

## ✅ Security Fixes Applied (2025-11-02)

### Issue: Command Injection Vulnerabilities
**Status:** FIXED ✓

**What was vulnerable:**
```javascript
// BEFORE (UNSAFE):
rad remote add ${nid} --name ${name}
git push ${friendName}
```

If someone entered: `friendName: "alice; rm -rf /"` it could execute arbitrary commands.

**What was fixed:**
```javascript
// AFTER (SAFE):
1. Input validation with regex patterns
2. Shell argument escaping
3. Reject dangerous characters

if (!isValidName(friendName)) {
  return res.status(400).json({ error: 'Invalid friend name' });
}
const cmd = `git push ${shellEscape(friendName)}`;
```

### Security Layers Now Active:

1. **Input Validation**
   - Friend names: Only `a-z A-Z 0-9 _ -`
   - Node IDs: Must match `did:key:z6Mk[...]` or `z6Mk[...]` format
   - Paths: Reject shell metacharacters `; & | \` $ < > ( )`

2. **Shell Escaping**
   - All user inputs wrapped in single quotes
   - Single quotes in input properly escaped: `'user'\''input'`

3. **Localhost Only**
   - Server binds to `localhost:5288` (not exposed to internet)
   - Only accessible from your machine

## Current Security Status

### ✅ SAFE:

**Local GUI Usage:**
- Running on localhost:5288 - not exposed to internet
- No remote access possible without port forwarding
- Protected against command injection
- Input validation on all API endpoints

**Sharing the Package:**
- Code is clean and auditable
- No malware or backdoors
- Your friend runs their own isolated instance
- Each instance only accepts localhost connections

**Radicle Protocol:**
- Cryptographically signed commits
- Node ID authentication required
- Encrypted transport (libp2p)
- Open source and audited

### ⚠️ RISKS TO CONSIDER:

**If You Open Port 8776 (P2P Direct Connections):**
- Exposes your machine to internet on that port
- Radicle daemon needs to stay updated
- Port scanners will see the open port (normal internet behavior)
- **Mitigation:** Use firewall rules to restrict to known IPs

**Server Runs Shell Commands:**
- Now secured with validation + escaping
- Still executes `rad` and `git` commands
- **Mitigation:** Only you can access localhost:5288
- **Mitigation:** Input validation prevents injection

## Recommendations

### For Most Users (Easiest & Safest):
```bash
# DON'T open ports, use seed node relay
rad remote add did:key:FRIEND_NID --name friend
git push friend main
```

**Pros:**
- ✅ No firewall/router configuration needed
- ✅ No ports exposed to internet
- ✅ Works immediately
- ✅ Still fully functional P2P

**Cons:**
- Slightly slower (traffic goes through public seeds)

### For Direct Connections (Advanced):

**Option 1: VPN/Tailscale (Most Secure)**
```bash
# Install Tailscale (creates encrypted mesh network)
brew install tailscale  # macOS
# Windows: download from tailscale.com

# Both you and friend join same Tailscale network
rad node config --listen 100.x.x.x:8776  # Use Tailscale IP
```

**Pros:**
- ✅ Fast direct connections
- ✅ Encrypted tunnel
- ✅ No port forwarding
- ✅ No firewall changes

**Option 2: Firewall-Restricted Direct (Advanced)**
```bash
# Open port but restrict to friend's IP
rad node config --listen 0.0.0.0:8776
sudo iptables -A INPUT -p tcp --dport 8776 -s FRIEND_IP -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 8776 -j DROP
```

**Pros:**
- ✅ Direct connections
- ✅ IP-restricted access

**Cons:**
- ⚠️ Requires firewall knowledge
- ⚠️ Must update if friend's IP changes

## Security Testing

### Test Command Injection Protection:
```bash
# This should be REJECTED:
curl -X POST http://localhost:5288/api/friends/add \
  -H "Content-Type: application/json" \
  -d '{"name":"alice; rm -rf /","nid":"did:key:z6Mk123"}'

# Response: {"error":"Invalid friend name..."}
```

### Test Node ID Validation:
```bash
# This should be REJECTED:
curl -X POST http://localhost:5288/api/friends/add \
  -H "Content-Type: application/json" \
  -d '{"name":"alice","nid":"malicious"}'

# Response: {"error":"Invalid Node ID format..."}
```

### Verify Localhost Only:
```bash
# From another machine on your network:
curl http://YOUR_IP:5288/api/friends
# Should FAIL (connection refused) because server binds to localhost only
```

## What Your Friend Should Know

When you share the package with your Windows friend:

**Safe to use because:**
1. They run their own isolated instance
2. Their instance also binds to localhost only
3. Same security protections apply
4. No network exposure unless they explicitly configure it

**Windows Security Notes:**
- Windows Defender may scan downloaded files (normal)
- They should run `npm install` to get dependencies fresh
- Their instance is completely separate from yours
- Their data stays on their machine

## Security Best Practices

1. **Keep Radicle Updated**
   ```bash
   rad self --update
   ```

2. **Review Friend Node IDs**
   - Always verify Node IDs through a trusted channel
   - Don't add unknown friends

3. **Monitor Your Node**
   ```bash
   rad node status  # Check connected peers
   rad node logs    # Review activity
   ```

4. **Use HTTPS for Web Access** (if you ever expose the GUI)
   - Don't expose port 5288 to internet
   - If needed, use reverse proxy with SSL (nginx/Caddy)

5. **Regular Audits**
   ```bash
   # Check what's listening
   lsof -i :5288
   lsof -i :8776

   # Check remotes
   rad remote list
   ```

## Threat Model

**What This Protects Against:**
- ✅ Command injection attacks
- ✅ Unauthorized local access (localhost only)
- ✅ Malformed input attacks
- ✅ Path traversal attempts

**What This Doesn't Protect Against:**
- ❌ Malware already on your system (nothing can)
- ❌ Physical access to your machine
- ❌ Compromise of your Radicle keys
- ❌ Social engineering (don't add untrusted friends)

**Out of Scope:**
- Browser vulnerabilities (keep browser updated)
- OS-level exploits (keep OS updated)
- Network attacks (use firewall)

## Incident Response

**If you suspect compromise:**

1. **Stop the services:**
   ```bash
   # Kill GUI server
   pkill -f "node server.js"

   # Stop Radicle node
   rad node stop
   ```

2. **Check for unauthorized remotes:**
   ```bash
   rad remote list
   # Remove suspicious ones:
   rad remote rm SUSPICIOUS_NAME
   ```

3. **Review logs:**
   ```bash
   rad node logs | grep -i error
   tail -100 ~/.radicle/node/node.log
   ```

4. **Rotate keys (if needed):**
   ```bash
   # Backup first!
   rad auth --init  # Creates new identity
   ```

## Summary: Is This Safe?

**YES** - with the security fixes applied:

✅ **For local use:** Completely safe
✅ **Sharing with friend:** Safe (they run isolated copy)
✅ **Using seed nodes:** Safe (no ports to open)
✅ **Direct P2P with VPN:** Safe (encrypted tunnel)

⚠️ **Opening port 8776 without protection:** Moderate risk
❌ **Exposing GUI port 5288 to internet:** Not recommended

**Bottom line:** The GUI is secure for local use and the friend-to-friend features work safely through the Radicle network. Use seed node relay for simplicity or Tailscale for fast direct connections.
