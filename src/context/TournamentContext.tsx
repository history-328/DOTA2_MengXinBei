import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { TournamentData, initialData, isValidTournamentData } from '../types';

const GET_DATA_URL = 'https://uks2fscaig.sealosbja.site/getData';
const SAVE_DATA_URL = 'https://uks2fscaig.sealosbja.site/saveData';

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
    let intervalId: any;

    const fetchRemoteData = async () => {
      try {
        const response = await fetch(GET_DATA_URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const fetchedData = await response.json();
        
        // Assume API returns data wrapped in an object or just the data directly.
        // We will pass it to our validator.
        if (isValidTournamentData(fetchedData)) {
          if (!isEditMode && JSON.stringify(fetchedData) !== JSON.stringify(dataRef.current)) {
            setDataState(fetchedData as TournamentData);
            dataRef.current = fetchedData as TournamentData;
            localStorage.setItem('tournamentData', JSON.stringify(fetchedData));
          }
        } else if (fetchedData.data && isValidTournamentData(fetchedData.data)) {
           // Handle if the API wraps it in { data: ... }
           if (!isEditMode && JSON.stringify(fetchedData.data) !== JSON.stringify(dataRef.current)) {
            setDataState(fetchedData.data as TournamentData);
            dataRef.current = fetchedData.data as TournamentData;
            localStorage.setItem('tournamentData', JSON.stringify(fetchedData.data));
          }
        }
      } catch (err) {
        console.error("Failed to fetch remote data:", err);
      }
    };

    const initDataProcess = async () => {
      // Timeout to stop loading and use local data if network is slow
      const loadingTimeout = setTimeout(() => {
        if (loading) {
          console.warn("Network connection timeout. Falling back to local data.");
          setLoading(false);
        }
      }, 5000); // 5 seconds timeout

      await fetchRemoteData();
      
      clearTimeout(loadingTimeout);
      if (loading) setLoading(false);

      // Poll every 10 seconds for real-time-ish updates
      intervalId = setInterval(fetchRemoteData, 10000);
    };

    initDataProcess();

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isEditMode]);

  const saveToServer = async () => {
    try {
      const response = await fetch(SAVE_DATA_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataRef.current)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save! Status: ${response.status}`);
      }
      
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
