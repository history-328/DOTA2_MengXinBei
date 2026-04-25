import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

// Initialize Firebase for backend access
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

const firebaseConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf-8'));
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

// API Routes
app.get('/api/data', async (req, res) => {
  try {
    const dataDocRef = doc(db, 'tournaments', 'data');
    const snapshot = await getDoc(dataDocRef);
    if (snapshot.exists()) {
      return res.json(snapshot.data());
    } else {
      return res.json({});
    }
  } catch (e) {
    console.error('Error fetching data from Firebase:', e);
    return res.status(500).json({ error: String(e) });
  }
});

app.post('/api/data', async (req, res) => {
  try {
    const dataDocRef = doc(db, 'tournaments', 'data');
    await setDoc(dataDocRef, req.body);
    res.json({ success: true });
  } catch (e) {
    console.error('Error saving data to Firebase:', e);
    res.status(500).json({ error: String(e) });
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
