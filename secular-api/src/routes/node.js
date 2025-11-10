import express from 'express';
import { execPromise } from '../utils/exec.js';

export const nodeRoutes = express.Router();

nodeRoutes.post('/start', async (req, res) => {
  try {
    const result = await execPromise('systemctl --user start radicle-node 2>&1');
    res.json({ success: true, output: result.stdout });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

nodeRoutes.post('/stop', async (req, res) => {
  try {
    const result = await execPromise('systemctl --user stop radicle-node 2>&1');
    res.json({ success: true, output: result.stdout });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
