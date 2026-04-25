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
  const [data, setDataState] = useState<TournamentData>(initialData);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Use a ref to track the latest data so we don't overwrite local changes while saving
  const dataRef = useRef<TournamentData>(initialData);

  useEffect(() => {
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
          // If we are in edit mode, we probably don't want to wildly overwrite the user's ongoing changes,
          // but for simplicity and since it's realtime, we overwrite if we're not currently making changes.
          // In a real app we'd merge or use field-level changes.
          if (!isEditMode && JSON.stringify(fetchedData) !== JSON.stringify(dataRef.current)) {
            setDataState(fetchedData as TournamentData);
            dataRef.current = fetchedData as TournamentData;
          }
        }
      }
      if (loading) setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'tournaments/data');
      if (loading) setLoading(false);
    });

    return () => unsubscribe();
  }, [isEditMode]);

  const saveToServer = async () => {
    try {
      const dataDocRef = doc(db, 'tournaments', 'data');
      await setDoc(dataDocRef, dataRef.current);
      alert("数据保存成功！现在所有人刷新网页都能看到最新的数据，且数据已永久保存。");
    } catch (e) {
      console.error('Failed to save data:', e);
      try {
        handleFirestoreError(e, OperationType.WRITE, 'tournaments/data');
      } catch (err) {
        alert(`保存失败: ${err instanceof Error ? JSON.parse(err.message).error : String(err)}`);
      }
    }
  };

  const setData: React.Dispatch<React.SetStateAction<TournamentData>> = (value) => {
    setDataState((prev) => {
      const nextData = typeof value === 'function' ? value(prev) : value;
      dataRef.current = nextData;
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
