#!/usr/bin/env node
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { systemRoutes } from './routes/system.js';
import { nodeRoutes } from './routes/node.js';
import { repoRoutes } from './routes/repos.js';
import { friendRoutes } from './routes/friends.js';
import { costRoutes } from './routes/cost.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5288;
const HOST = process.env.HOST || '0.0.0.0';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// Middleware
app.use(express.json());
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true
}));

// Optional API key authentication
if (process.env.ENABLE_AUTH === 'true') {
  app.use((req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== process.env.API_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  });
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

// API Routes
app.use('/api/system', systemRoutes);
app.use('/api/node', nodeRoutes);
app.use('/api/repos', repoRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/cost', costRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, HOST, () => {
  console.log(`🚀 Secular API Server running on http://${HOST}:${PORT}`);
  console.log(`📝 API Documentation: http://${HOST}:${PORT}/api/docs`);
  console.log(`💚 Health check: http://${HOST}:${PORT}/health`);
  if (process.env.ENABLE_AUTH === 'true') {
    console.log('🔒 API Key authentication enabled');
  }
});
