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

let inMemoryData: any = null;
try {
  if (fs.existsSync('fallback-db.json')) {
    inMemoryData = JSON.parse(fs.readFileSync('fallback-db.json', 'utf-8'));
  }
} catch(e) {}

// API Routes
app.get('/api/data', async (req, res) => {
  try {
    const dataDocRef = doc(db, 'tournaments', 'data');
    const snapshot = await getDoc(dataDocRef);
    if (snapshot.exists()) {
      inMemoryData = snapshot.data();
      fs.writeFileSync('fallback-db.json', JSON.stringify(inMemoryData));
      return res.json(inMemoryData);
    } else {
      return res.json(inMemoryData || {});
    }
  } catch (e) {
    console.error('Error fetching data from Firebase:', e);
    // Fallback to in-memory data
    return res.json(inMemoryData || {});
  }
});

app.post('/api/data', async (req, res) => {
  inMemoryData = req.body;
  try {
    fs.writeFileSync('fallback-db.json', JSON.stringify(inMemoryData));
  } catch(e) {}
  
  try {
    const dataDocRef = doc(db, 'tournaments', 'data');
    await setDoc(dataDocRef, req.body);
    res.json({ success: true, usingFallback: false });
  } catch (e) {
    console.error('Error saving data to Firebase (fallback to memory):', e);
    // Still return success to the user so they can continue to use the app in memory!
    res.json({ success: true, usingFallback: true, warning: String(e) });
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
