import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { saveUserData, getUserData } from '@/lib/firestore';

type LogEntry = {
  id: string;
  name: string;
  calories: number;
  timestamp: number;
};

type CaloriesContextType = {
  logs: LogEntry[];
  addLog: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void;
};

const CaloriesContext = createContext<CaloriesContextType | null>(null);

export function CaloriesProvider({ children }: { children: ReactNode }) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const userEmail = auth.currentUser?.email;

  // Load logs from Firestore when user logs in
  useEffect(() => {
    const fetchLogs = async () => {
      if (!userEmail) return;
      try {
        const data = await getUserData(userEmail);
        if (data?.items) {
          setLogs(data.items);
        }
      } catch (error) {
        console.error('Failed to fetch logs from Firestore:', error);
      }
    };

    fetchLogs();
  }, [userEmail]);

  const addLog = (entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
    const newEntry: LogEntry = {
      id: Math.random().toString(),
      timestamp: Date.now(),
      ...entry,
    };

    setLogs((prev) => {
      const updatedLogs = [newEntry, ...prev];

      // Save updated logs to Firestore
      if (userEmail) {
        const totalCalories = updatedLogs.reduce((sum, item) => sum + item.calories, 0);
        saveUserData(userEmail, totalCalories, updatedLogs).catch((err) =>
          console.error('Failed to save logs to Firestore:', err)
        );
      }

      return updatedLogs;
    });
  };

  return <CaloriesContext.Provider value={{ logs, addLog }}>{children}</CaloriesContext.Provider>;
}

export const useCalories = () => {
  const context = useContext(CaloriesContext);
  if (!context) {
    throw new Error('useCalories must be used inside CaloriesProvider');
  }
  return context;
};
