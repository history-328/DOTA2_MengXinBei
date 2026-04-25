import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { TournamentData, initialData, isValidTournamentData } from '../types';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {},
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

type TournamentContextType = {
  data: TournamentData;
  setData: React.Dispatch<React.SetStateAction<TournamentData>>;
  isEditMode: boolean;
  setIsEditMode: React.Dispatch<React.SetStateAction<boolean>>;
  resetData: () => void;
  saveToServer: () => Promise<void>;
};

const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

export const TournamentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setDataState] = useState<TournamentData>(() => {
    const saved = localStorage.getItem('tournamentData');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (isValidTournamentData(parsed)) return parsed;
      } catch (e) {
        console.error('Failed to parse local data', e);
      }
    }
    return initialData;
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Use a ref to track the latest data so we don't overwrite local changes while saving
  const dataRef = useRef<TournamentData>(data);

  useEffect(() => {
    // Timeout to stop loading and use local data if Firebase is blocked or slow
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.warn("Firebase connection timeout or blocked. Falling back to local data.");
        setLoading(false);
      }
    }, 5000); // 5 seconds timeout

    const dataDocRef = doc(db, 'tournaments', 'data');
    
    // Test connection first
    getDoc(dataDocRef).catch((error) => {
      if(error instanceof Error && error.message.includes('the client is offline')) {
        console.error("Please check your Firebase configuration.");
      }
    });

    const unsubscribe = onSnapshot(dataDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const fetchedData = snapshot.data();
        if (isValidTournamentData(fetchedData)) {
          if (!isEditMode && JSON.stringify(fetchedData) !== JSON.stringify(dataRef.current)) {
            setDataState(fetchedData as TournamentData);
            dataRef.current = fetchedData as TournamentData;
            localStorage.setItem('tournamentData', JSON.stringify(fetchedData));
          }
        }
      }
      clearTimeout(loadingTimeout);
      if (loading) setLoading(false);
    }, (error) => {
      console.error("Firebase sync error:", error);
      clearTimeout(loadingTimeout);
      if (loading) setLoading(false);
    });

    return () => {
      clearTimeout(loadingTimeout);
      unsubscribe();
    };
  }, [isEditMode]);

  const saveToServer = async () => {
    try {
      const dataDocRef = doc(db, 'tournaments', 'data');
      await setDoc(dataDocRef, dataRef.current);
      localStorage.setItem('tournamentData', JSON.stringify(dataRef.current));
      alert("数据保存成功！现在所有人刷新网页都能看到最新的数据，且数据已永久保存。");
    } catch (e) {
      console.error('Failed to save data:', e);
      alert(`保存失败（如果没开梯子可能无法同步到云端）: ${e instanceof Error ? e.message : String(e)}`);
      // Even if server fails, we save locally
      localStorage.setItem('tournamentData', JSON.stringify(dataRef.current));
    }
  };

  const setData: React.Dispatch<React.SetStateAction<TournamentData>> = (value) => {
    setDataState((prev) => {
      const nextData = typeof value === 'function' ? value(prev) : value;
      dataRef.current = nextData;
      localStorage.setItem('tournamentData', JSON.stringify(nextData)); // Save to local on every change
      return nextData;
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
    <TournamentContext.Provider value={{ data, setData, isEditMode, setIsEditMode, resetData, saveToServer }}>
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
