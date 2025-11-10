import express from 'express';

export const costRoutes = express.Router();

costRoutes.get('/metrics', async (req, res) => {
  res.json({
    compute: 3.65,
    storage: 0.80,
    egress: 2.40,
    total: 6.85,
    history: []
  });
});
