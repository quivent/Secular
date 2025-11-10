import express from 'express';
import { execPromise, isValidName, isValidNodeId, isValidPath, shellEscape } from '../utils/exec.js';

export const friendRoutes = express.Router();

friendRoutes.get('/', async (req, res) => {
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

friendRoutes.post('/add', async (req, res) => {
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

friendRoutes.delete('/:name', async (req, res) => {
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

// Friend Push/Pull/Sync
friendRoutes.post('/push', async (req, res) => {
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

friendRoutes.post('/pull', async (req, res) => {
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

friendRoutes.post('/sync', async (req, res) => {
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
