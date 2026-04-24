import React, { createContext, useContext, useState, useEffect } from 'react';
import { TournamentData, initialData, isValidTournamentData } from '../types';

type TournamentContextType = {
  data: TournamentData;
  setData: React.Dispatch<React.SetStateAction<TournamentData>>;
  isEditMode: boolean;
  setIsEditMode: React.Dispatch<React.SetStateAction<boolean>>;
  resetData: () => void;
};

const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

export const TournamentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<TournamentData>(() => {
    const saved = localStorage.getItem('dota2-tournament-data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (isValidTournamentData(parsed)) {
          return parsed;
        } else {
          console.error('Invalid data format in localStorage. Falling back to initial state.');
        }
      } catch (e) {
        console.error('Failed to parse saved data', e);
      }
    }
    return initialData;
  });

  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    localStorage.setItem('dota2-tournament-data', JSON.stringify(data));
  }, [data]);

  const resetData = () => {
    if (window.confirm('Are you sure you want to reset all data? This cannot be undone.')) {
      setData(initialData);
    }
  };

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
