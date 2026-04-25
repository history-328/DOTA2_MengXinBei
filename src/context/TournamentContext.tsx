import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { TournamentData, initialData, isValidTournamentData } from '../types';
import { db, signInAnonymously } from '../tcb';

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
    let watcher: any = null;

    const initDb = async () => {
      // Timeout to stop loading and use local data if TCB is blocked or slow
      const loadingTimeout = setTimeout(() => {
        if (loading) {
          console.warn("TCB connection timeout or blocked. Falling back to local data.");
          setLoading(false);
        }
      }, 5000); // 5 seconds timeout

      try {
        await signInAnonymously();

        // 1. Fetch initial data
        const res = await db.collection('mengxinbei').doc('tournament_data').get();
        if (res.data && res.data.length > 0) {
          const fetchedData = res.data[0];
          delete fetchedData._id;
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

        // 2. Watch for changes
        watcher = db.collection('mengxinbei').where({ _id: 'tournament_data' }).watch({
          onChange: function(snapshot: any) {
            if (snapshot.docs && snapshot.docs.length > 0) {
              const fetchedData = snapshot.docs[0];
              delete fetchedData._id;
              if (isValidTournamentData(fetchedData)) {
                if (!isEditMode && JSON.stringify(fetchedData) !== JSON.stringify(dataRef.current)) {
                  setDataState(fetchedData as TournamentData);
                  dataRef.current = fetchedData as TournamentData;
                  localStorage.setItem('tournamentData', JSON.stringify(fetchedData));
                }
              }
            }
          },
          onError: function(err: any) {
            console.error("TCB watch error", err);
          }
        });

      } catch (err) {
        console.error("TCB init fail:", err);
        clearTimeout(loadingTimeout);
        if (loading) setLoading(false);
      }
    };

    initDb();

    return () => {
      if (watcher) watcher.close();
    };
  }, [isEditMode]);

  const saveToServer = async () => {
    try {
      // TCB uses set/update. We can just try to set which will replace or create the doc
      const res = await db.collection('mengxinbei').doc('tournament_data').set(dataRef.current);
      console.log('TCB save result:', res);
      
      localStorage.setItem('tournamentData', JSON.stringify(dataRef.current));
      alert("数据保存成功！现在所有人刷新网页都能看到最新的数据，且数据已永久保存。");
    } catch (e) {
      console.error('Failed to save data:', e);
      alert(`保存失败: ${e instanceof Error ? e.message : String(e)}`);
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
