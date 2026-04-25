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

  const loadData = async () => {
    try {
      const res = await fetch('/api/data');
      if (res.ok) {
        const fetchedData = await res.json();
        // If the server data is valid and not empty
        if (fetchedData && typeof fetchedData === 'object' && Object.keys(fetchedData).length > 0) {
          if (isValidTournamentData(fetchedData)) {
             // Only update if it's different to prevent unnecessary re-renders
             if (JSON.stringify(fetchedData) !== JSON.stringify(dataRef.current)) {
                setDataState(fetchedData);
                dataRef.current = fetchedData;
             }
          }
        }
      }
    } catch (e) {
      console.error('Failed to load data:', e);
    } finally {
      if (loading) setLoading(false);
    }
  };

  const saveToServer = async () => {
    try {
      const res = await fetch('/api/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataRef.current),
      });
      if (res.ok) {
        alert("数据保存成功！当前访问此网页的其他人刷新都能看到。注意：由于服务器无持久化数据库，部署后或服务器休眠重启后数据将重置。");
      } else {
        alert("保存失败");
      }
    } catch (e) {
      console.error('Failed to save data:', e);
      alert("保存失败");
    }
  };

  useEffect(() => {
    loadData();
    // Poll for updates every 3 seconds
    const interval = setInterval(() => {
      // Don't poll if we're in edit mode to avoid overwriting ongoing edits
      if (!isEditMode) {
        loadData();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [isEditMode, loading]);

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
