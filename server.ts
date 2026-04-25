import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';

// Load environment variables for the server
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './src/firebase';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

app.get('/api/tournament', async (req, res) => {
  try {
    const dataDocRef = doc(db, 'tournaments', 'data');
    const snapshot = await getDoc(dataDocRef);
    if (snapshot.exists()) {
      return res.json(snapshot.data());
    } else {
      return res.status(404).json({ error: 'Data not found' });
    }
  } catch (error) {
    console.error('Firebase error:', error);
    return res.status(500).json({ error: 'Failed to fetch' });
  }
});

app.post('/api/tournament', async (req, res) => {
  try {
    const dataDocRef = doc(db, 'tournaments', 'data');
    await setDoc(dataDocRef, req.body);
    res.json({ success: true });
  } catch (error) {
    console.error('Firebase error:', error);
    res.status(500).json({ error: `Saving to Firebase error: ${error instanceof Error ? error.message : String(error)}` });
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
