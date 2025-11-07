#!/usr/bin/env node
const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static('dist'));

// Security: Shell escape function
function shellEscape(arg) {
  return `'${arg.replace(/'/g, "'\\''")}'`;
}

// Security: Validate alphanumeric names (for friend names, remote names)
function isValidName(name) {
  return /^[a-zA-Z0-9_-]+$/.test(name);
}

// Security: Validate Node IDs (Radicle format)
function isValidNodeId(nid) {
  // Radicle Node IDs start with did:key:z6Mk or just z6Mk
  return /^(did:key:)?z6Mk[a-zA-Z0-9]+$/.test(nid);
}

// Security: Validate paths (no command injection)
function isValidPath(p) {
  // Reject paths with shell metacharacters
  return !/[;&|`$<>()]/.test(p);
}

// Helper to execute shell commands
function execPromise(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        // With 2>&1, stderr goes to stdout, so check stdout for error details
        const errorOutput = stdout || stderr || error.message;
        reject({ error: error.message, stderr, stdout, errorOutput });
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

// API Routes
app.get('/api/system/status', async (req, res) => {
  try {
    const nodeStatus = await execPromise('rad node status 2>&1 || echo "Node not running"');
    const uptime = await execPromise('uptime');

    // Count repos
    let repoCount = 0;
    try {
      const repoList = await execPromise('rad ls 2>&1');
      const lines = repoList.stdout.split('\n').filter(line =>
        line.includes('rad:') && !line.includes('│ Name')
      );
      repoCount = lines.length;
    } catch (e) {
      // Ignore errors
    }

    // Count peers from node status
    let peerCount = 0;
    try {
      const peerMatches = nodeStatus.stdout.match(/z6Mk[a-zA-Z0-9]+/g);
      if (peerMatches) {
        peerCount = new Set(peerMatches).size; // Deduplicate
      }
    } catch (e) {
      // Ignore errors
    }

    res.json({
      node_running: !nodeStatus.stdout.includes('not running'),
      uptime: uptime.stdout.trim(),
      peers: peerCount,
      repos: repoCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/node/start', async (req, res) => {
  try {
    const result = await execPromise('systemctl --user start radicle-node 2>&1');
    res.json({ success: true, output: result.stdout });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/node/stop', async (req, res) => {
  try {
    const result = await execPromise('systemctl --user stop radicle-node 2>&1');
    res.json({ success: true, output: result.stdout });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/repos', async (req, res) => {
  try {
    const result = await execPromise('rad ls 2>&1');

    // Parse the table output
    const lines = result.stdout.split('\n');
    const repos = [];

    for (const line of lines) {
      // Skip headers, borders, and empty lines
      if (line.includes('│') && !line.includes('Name') && !line.includes('──')) {
        // Extract columns from table (Name, RID, Visibility, Head, Description)
        const match = line.match(/│\s+(.+?)\s+rad:([\w\d]+)\s+(public|private)\s+([\w\d]+)\s+(.+?)\s*│/);
        if (match) {
          repos.push({
            name: match[1].trim(),
            rid: `rad:${match[2]}`,
            visibility: match[3],
            head: match[4],
            description: match[5].trim()
          });
        }
      }
    }

    res.json({ repos });
  } catch (err) {
    res.status(500).json({ error: err.message, repos: [] });
  }
});

app.get('/api/cost/metrics', async (req, res) => {
  res.json({
    compute: 3.65,
    storage: 0.80,
    egress: 2.40,
    total: 6.85,
    history: []
  });
});

// Radicle Repository Management
app.post('/api/repos/init', async (req, res) => {
  const { path, name, description, visibility } = req.body;
  try {
    const visFlag = visibility === 'private' ? '--private' : '--public';
    const result = await execPromise(
      `cd "${path}" && rad init --name "${name}" --description "${description}" ${visFlag} --no-confirm 2>&1`
    );
    res.json({ success: true, output: result.stdout });
  } catch (err) {
    res.status(500).json({ error: err.message, details: err.stderr });
  }
});

app.post('/api/repos/clone', async (req, res) => {
  const { rid, seed, path } = req.body;
  try {
    const seedFlag = seed ? `--seed ${seed}` : '';
    const pathFlag = path ? `--path "${path}"` : '';
    const result = await execPromise(
      `rad clone ${rid} ${seedFlag} ${pathFlag} 2>&1`
    );
    res.json({ success: true, output: result.stdout });
  } catch (err) {
    res.status(500).json({ error: err.message, details: err.stderr });
  }
});

app.post('/api/repos/push', async (req, res) => {
  const { path } = req.body;
  try {
    const result = await execPromise(`cd "${path}" && git push rad 2>&1`);
    res.json({ success: true, output: result.stdout });
  } catch (err) {
    res.status(500).json({ error: err.message, details: err.stderr });
  }
});

app.post('/api/repos/pull', async (req, res) => {
  const { path } = req.body;
  try {
    const result = await execPromise(`cd "${path}" && git pull rad 2>&1`);
    res.json({ success: true, output: result.stdout });
  } catch (err) {
    res.status(500).json({ error: err.message, details: err.stderr });
  }
});

app.post('/api/repos/sync', async (req, res) => {
  const { path } = req.body;
  try {
    // Sync does both pull and push
    const pullResult = await execPromise(`cd "${path}" && git pull rad 2>&1`);
    const pushResult = await execPromise(`cd "${path}" && git push rad 2>&1`);
    res.json({
      success: true,
      output: `Pull:\n${pullResult.stdout}\n\nPush:\n${pushResult.stdout}`
    });
  } catch (err) {
    res.status(500).json({ error: err.message, details: err.stderr });
  }
});

app.get('/api/repos/inspect', async (req, res) => {
  const { path } = req.query;
  try {
    const cmd = path ? `cd "${path}" && rad inspect 2>&1` : 'rad inspect 2>&1';
    const result = await execPromise(cmd);
    res.json({ rid: result.stdout.trim() });
  } catch (err) {
    res.status(500).json({ error: err.message, details: err.stderr });
  }
});

app.post('/api/repos/seed', async (req, res) => {
  const { rid, seed } = req.body;
  try {
    const result = await execPromise(`rad seed ${rid} --scope followed --seed ${seed} 2>&1`);
    res.json({ success: true, output: result.stdout });
  } catch (err) {
    res.status(500).json({ error: err.message, details: err.stderr });
  }
});

// Friend Management API
app.get('/api/friends', async (req, res) => {
  const { repoPath } = req.query;

  if (!repoPath) {
    return res.json({ friends: [] });
  }

  try {
    const result = await execPromise(`cd "${repoPath}" && rad remote list 2>&1`);
    // Parse the output to extract friend information
    // Format: name z6Mk... (fetch/push)
    // Note: rad remote list shows each remote twice (fetch and push)
    const lines = result.stdout.trim().split('\n').filter(line => line.trim());
    const friendsMap = new Map();

    for (const line of lines) {
      // Match: name node_id (fetch|push)
      const match = line.match(/^(\S+)\s+(z6Mk[a-zA-Z0-9]+|did:key:z6Mk[a-zA-Z0-9]+)/);
      if (match) {
        const name = match[1];
        const nid = match[2];

        // Only add once (avoid fetch/push duplicates)
        if (!friendsMap.has(name)) {
          friendsMap.set(name, {
            name: name,
            nid: nid,
            status: 'unknown',
            repos: 0
          });
        }
      }
    }

    res.json({ friends: Array.from(friendsMap.values()) });
  } catch (err) {
    res.json({ friends: [] }); // Return empty list if no remotes
  }
});

app.post('/api/friends/add', async (req, res) => {
  const { nid, name, repoPath } = req.body;

  // Security: Validate inputs
  if (!isValidName(name)) {
    return res.status(400).json({ error: 'Invalid friend name. Use only letters, numbers, dashes, and underscores.' });
  }
  if (!isValidNodeId(nid)) {
    return res.status(400).json({ error: 'Invalid Node ID format. Should start with did:key:z6Mk or z6Mk' });
  }
  if (!repoPath) {
    return res.status(400).json({ error: 'Repository path is required' });
  }

  try {
    const result = await execPromise(`cd "${repoPath}" && rad remote add ${shellEscape(nid)} --name ${shellEscape(name)} 2>&1`);
    res.json({ success: true, output: result.stdout });
  } catch (err) {
    // With 2>&1 redirect, actual error details are in stdout
    const errorMsg = err.errorOutput || err.stdout || err.stderr || err.error || 'Unknown error occurred';
    res.status(500).json({ error: errorMsg.trim() });
  }
});

app.delete('/api/friends/:name', async (req, res) => {
  const { name } = req.params;
  const { repoPath } = req.query;

  // Security: Validate name
  if (!isValidName(name)) {
    return res.status(400).json({ error: 'Invalid friend name' });
  }
  if (!repoPath) {
    return res.status(400).json({ error: 'Repository path is required' });
  }

  try {
    const result = await execPromise(`cd "${repoPath}" && rad remote rm ${shellEscape(name)} 2>&1`);
    res.json({ success: true, output: result.stdout });
  } catch (err) {
    res.status(500).json({ error: err.message, details: err.stderr });
  }
});

// Friend Push/Pull/Sync API
app.post('/api/friends/push', async (req, res) => {
  const { friendName, repoPath } = req.body;

  // Security: Validate inputs
  if (!isValidName(friendName)) {
    return res.status(400).json({ error: 'Invalid friend name' });
  }
  if (repoPath && !isValidPath(repoPath)) {
    return res.status(400).json({ error: 'Invalid repository path' });
  }

  try {
    const cmd = repoPath
      ? `cd ${shellEscape(repoPath)} && git push ${shellEscape(friendName)} 2>&1`
      : `git push ${shellEscape(friendName)} 2>&1`;
    const result = await execPromise(cmd);
    res.json({ success: true, output: result.stdout });
  } catch (err) {
    res.status(500).json({ error: err.message, details: err.stderr });
  }
});

app.post('/api/friends/pull', async (req, res) => {
  const { friendName, repoPath } = req.body;

  // Security: Validate inputs
  if (!isValidName(friendName)) {
    return res.status(400).json({ error: 'Invalid friend name' });
  }
  if (repoPath && !isValidPath(repoPath)) {
    return res.status(400).json({ error: 'Invalid repository path' });
  }

  try {
    const cmd = repoPath
      ? `cd ${shellEscape(repoPath)} && git pull ${shellEscape(friendName)} 2>&1`
      : `git pull ${shellEscape(friendName)} 2>&1`;
    const result = await execPromise(cmd);
    res.json({ success: true, output: result.stdout });
  } catch (err) {
    res.status(500).json({ error: err.message, details: err.stderr });
  }
});

app.post('/api/friends/sync', async (req, res) => {
  const { friendName, repoPath } = req.body;

  // Security: Validate inputs
  if (friendName && !isValidName(friendName)) {
    return res.status(400).json({ error: 'Invalid friend name' });
  }
  if (repoPath && !isValidPath(repoPath)) {
    return res.status(400).json({ error: 'Invalid repository path' });
  }

  try {
    const cmd = repoPath
      ? `cd ${shellEscape(repoPath)} && rad sync --announce 2>&1`
      : 'rad sync --announce 2>&1';
    const result = await execPromise(cmd);
    res.json({ success: true, output: result.stdout });
  } catch (err) {
    res.status(500).json({ error: err.message, details: err.stderr });
  }
});

// Serve the frontend - fallback route for SPA
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 5288;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Secular GUI API running on http://0.0.0.0:${PORT}`);
});
