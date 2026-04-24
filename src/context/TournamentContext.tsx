import React, { createContext, useContext, useState, useEffect } from 'react';
import { TournamentData, initialData, isValidTournamentData } from '../types';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';

type TournamentContextType = {
  data: TournamentData;
  setData: React.Dispatch<React.SetStateAction<TournamentData>>;
  isEditMode: boolean;
  setIsEditMode: React.Dispatch<React.SetStateAction<boolean>>;
  resetData: () => void;
};

const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

export const TournamentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setDataState] = useState<TournamentData>(initialData);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(true);

  // Read initial data from Firestore
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'tournaments', 'main'), (docSnap) => {
      if (docSnap.exists()) {
        const firestoreData = docSnap.data() as any;
        if (isValidTournamentData(firestoreData)) {
          setDataState(firestoreData);
        } else {
          console.error("Invalid data in Firestore");
        }
      } else {
        // Do local storage fallback or just use initialData if not exist
        const saved = localStorage.getItem('dota2-tournament-data');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (isValidTournamentData(parsed)) {
              setDataState(parsed);
              // Migrate to Firestore
              setDoc(doc(db, 'tournaments', 'main'), parsed).catch(e => console.error("Migration error:", e));
            }
          } catch (e) {
            console.error('Failed to parse saved data', e);
          }
        } else {
          // Initialize empty tournament
          setDoc(doc(db, 'tournaments', 'main'), initialData).catch(e => console.error("Init error:", e));
        }
      }
      setLoading(false);
    }, (error) => {
      console.error('Firestore subscription error:', error);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const setData: React.Dispatch<React.SetStateAction<TournamentData>> = (value) => {
    // We update local state optimistically, but mainly write to firestore
    setDataState((prev) => {
      const nextData = typeof value === 'function' ? value(prev) : value;
      // Write to firestore asynchronously
      setDoc(doc(db, 'tournaments', 'main'), nextData).catch((error) => {
         console.error('Firestore Write Error:', error);
      });
      return nextData; // Return nextData to update local state optimistically
    });
  };

  const resetData = () => {
    if (window.confirm('确定清除所有数据？操作不可逆转。')) {
      setData(initialData);
    }
  };

  if (loading) {
    return <div className="flex bg-background items-center justify-center h-screen w-screen text-white"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mr-3"></div>加载数据中...</div>;
  }

  return (
    <TournamentContext.Provider value={{ data, setData, isEditMode, setIsEditMode, resetData }}>
      {children}
    </TournamentContext.Provider>
  );
};

export const useTournament = () => {
  const context = useContext(TournamentContext);
  if (!context) {
    throw new Error('useTournament must be used within a TournamentProvider');
  }
  return context;
};
