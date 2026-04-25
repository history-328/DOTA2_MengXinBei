import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function test() {
  try {
    const dataDocRef = doc(db, 'tournaments', 'data');
    const snapshot = await getDoc(dataDocRef);
    console.log("Snapshot exists:", snapshot.exists());
    if (snapshot.exists()) {
      console.log("Data:", Object.keys(snapshot.data()));
    }
  } catch (e) {
    console.error("Error:", e);
  }
}
test();
