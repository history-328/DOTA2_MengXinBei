import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { TournamentData, initialData, isValidTournamentData } from '../types';

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
    let active = true;
    
    const loadData = async () => {
      try {
        const res = await fetch('/api/tournament');
        if (res.ok) {
          const fetchedData = await res.json();
          if (isValidTournamentData(fetchedData)) {
            if (!isEditMode && JSON.stringify(fetchedData) !== JSON.stringify(dataRef.current)) {
              setDataState(fetchedData as TournamentData);
              dataRef.current = fetchedData as TournamentData;
            }
          }
        }
      } catch (error) {
        console.error("Please check your network. Failed to fetch data.");
      } finally {
        if (loading && active) setLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 10000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [isEditMode, loading]);

  const saveToServer = async () => {
    try {
      const res = await fetch('/api/tournament', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataRef.current)
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Save failed with status ${res.status}`);
      }
      alert("数据保存成功！现在所有人刷新网页都能看到最新的数据，且数据已永久保存。");
    } catch (e) {
      console.error('Failed to save data:', e);
      alert(`保存失败: ${e instanceof Error ? e.message : String(e)}`);
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
