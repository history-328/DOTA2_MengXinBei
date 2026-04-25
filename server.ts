import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(process.cwd(), 'tournament_data.json');

app.use(express.json({ limit: '50mb' }));

// Load initial data
let inMemoryData: any = null;
try {
  if (fs.existsSync(DATA_FILE)) {
    inMemoryData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  }
} catch (e) {
  console.error('Error reading initial data:', e);
}

// API Routes
app.get('/api/data', (req, res) => {
  res.json(inMemoryData || {});
});

app.post('/api/data', (req, res) => {
  inMemoryData = req.body;
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(inMemoryData, null, 2));
    res.json({ success: true });
  } catch (e) {
    console.error('Error saving data:', e);
    res.status(500).json({ error: 'Failed to save data' });
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
