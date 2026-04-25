import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { put } from '@vercel/blob';

const app = express();
const PORT = 3000;
const VERCEL_BASE_URL = 'https://lmvlhwwjh7ptuh8u.public.blob.vercel-storage.com';
const JSON_FILENAME = 'dota2-tournament-data.json';
const OLD_FILENAME = 'dota2-tournament-data%20(10).json';

app.use(express.json({ limit: '50mb' }));

// Load initial data
let inMemoryData: any = null;

// API Routes
app.get('/api/data', async (req, res) => {
  try {
    // Try fetching the new custom named file first
    let fetchRes = await fetch(`${VERCEL_BASE_URL}/${JSON_FILENAME}?t=${Date.now()}`);
    if (!fetchRes.ok) {
      // Fallback to the one the user manually uploaded 
      fetchRes = await fetch(`${VERCEL_BASE_URL}/${OLD_FILENAME}?t=${Date.now()}`);
    }

    if (fetchRes.ok) {
      const data = await fetchRes.json();
      inMemoryData = data;
      return res.json(data);
    } else {
      // Use fallback if blob fetch fails
      return res.json(inMemoryData || {});
    }
  } catch (e) {
    console.error('Error fetching data from Vercel Blob:', e);
    return res.json(inMemoryData || {});
  }
});

app.post('/api/data', async (req, res) => {
  inMemoryData = req.body;
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.warn("BLOB_READ_WRITE_TOKEN is not set in environment variables. Data was not saved to Vercel.");
      return res.status(500).json({ error: 'BLOB_READ_WRITE_TOKEN is missing' });
    }

    await put(JSON_FILENAME, JSON.stringify(inMemoryData, null, 2), {
      access: 'public',
      addRandomSuffix: false,
      token: process.env.BLOB_READ_WRITE_TOKEN
    });

    res.json({ success: true });
  } catch (e) {
    console.error('Error saving data to Vercel string:', e);
    res.status(500).json({ error: 'Failed to save data to Vercel' });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static file serving
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
