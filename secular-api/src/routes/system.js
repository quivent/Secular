import express from 'express';
import { execPromise } from '../utils/exec.js';

export const systemRoutes = express.Router();

systemRoutes.get('/status', async (req, res) => {
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
