# Secular Deployment - Ready to Use

Your Secular source control server is **running** on GCP.

## Server Details

```
IP Address: 35.222.36.165
Node ID:    z6MksRcAyPSC8jhAbtemC8PzMnUGb5sBgYH1TKqvbC2KWpr3
Status:     Active and connected to network
P2P Port:   8776
Web GUI:    http://35.222.36.165:5288
```

## View Your Node in Browser

**Open this URL:** http://35.222.36.165:5288

You can:
- Browse repositories
- Monitor node status
- View peers and connections
- Manage repositories through the web interface

## How to Use It

### 1. Push a Repository to Your Server

```bash
# Go to your existing git repo
cd /path/to/your/git/repo

# Initialize it as a Radicle/Secular repo
secular repos init

# Add your server as a friend
secular friend add z6MksRcAyPSC8jhAbtemC8PzMnUGb5sBgYH1TKqvbC2KWpr3 --address 35.222.36.165:8776

# Publish to your server (push + announce)
secular repos publish
```

### 2. Clone from Your Server

```bash
secular repos clone <repo-id> --seed 35.222.36.165:8776
```

### 3. List Repos on Your Server

```bash
secular friend repos z6MksRcAyPSC8jhAbtemC8PzMnUGb5sBgYH1TKqvbC2KWpr3
```

### 4. Check Server Status

```bash
gcloud compute ssh secular-node --zone=us-central1-a
sudo systemctl status secular-node
```

## That's It!

Your server will:
- Auto-start on boot
- Auto-restart if it crashes
- Connect to the Radicle P2P network
- Cost ~$24/month (e2-medium)

## Cost Savings (Optional)

To reduce cost to ~$8/month, downgrade to e2-micro:

```bash
gcloud compute instances stop secular-node --zone=us-central1-a
gcloud compute instances set-machine-type secular-node --machine-type=e2-micro --zone=us-central1-a
gcloud compute instances start secular-node --zone=us-central1-a
```
