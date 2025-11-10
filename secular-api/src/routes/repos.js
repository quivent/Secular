import express from 'express';
import { execPromise } from '../utils/exec.js';

export const repoRoutes = express.Router();

repoRoutes.get('/', async (req, res) => {
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

repoRoutes.post('/init', async (req, res) => {
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

repoRoutes.post('/clone', async (req, res) => {
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

repoRoutes.post('/push', async (req, res) => {
  const { path } = req.body;
  try {
    const result = await execPromise(`cd "${path}" && git push rad 2>&1`);
    res.json({ success: true, output: result.stdout });
  } catch (err) {
    res.status(500).json({ error: err.message, details: err.stderr });
  }
});

repoRoutes.post('/pull', async (req, res) => {
  const { path } = req.body;
  try {
    const result = await execPromise(`cd "${path}" && git pull rad 2>&1`);
    res.json({ success: true, output: result.stdout });
  } catch (err) {
    res.status(500).json({ error: err.message, details: err.stderr });
  }
});

repoRoutes.post('/sync', async (req, res) => {
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

repoRoutes.get('/inspect', async (req, res) => {
  const { path } = req.query;
  try {
    const cmd = path ? `cd "${path}" && rad inspect 2>&1` : 'rad inspect 2>&1';
    const result = await execPromise(cmd);
    res.json({ rid: result.stdout.trim() });
  } catch (err) {
    res.status(500).json({ error: err.message, details: err.stderr });
  }
});

repoRoutes.post('/seed', async (req, res) => {
  const { rid, seed } = req.body;
  try {
    const result = await execPromise(`rad seed ${rid} --scope followed --seed ${seed} 2>&1`);
    res.json({ success: true, output: result.stdout });
  } catch (err) {
    res.status(500).json({ error: err.message, details: err.stderr });
  }
});
