import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { UserProfile, DailyMetrics, RunSession, WeeklyData, Target, TrainingSchedule, ChatMessage, JournalArticle } from './types';
import {
  userProfile as defaultProfile,
  dailyMetrics as defaultDaily,
  runSessions as defaultRuns,
  weeklyData as defaultWeekly,
  targets as defaultTargets,
  trainingSchedule as defaultSchedule,
  journalArticles as defaultJournals,
  vitalityHistory as defaultVitality,
  weeklyHealthReport as defaultHealthReport,
} from './data';

// CSV Row type for imported data
export interface CSVRow {
  [key: string]: string;
}

export interface ImportedFile {
  id: string;
  name: string;
  type: string;
  size: string;
  date: string;
  status: 'processed' | 'pending' | 'error';
  records: number;
  csvData?: CSVRow[];
  csvHeaders?: string[];
}

interface AppState {
  profile: UserProfile;
  dailyMetrics: DailyMetrics;
  dailyMetricsHistory: DailyMetrics[];
  runSessions: RunSession[];
  weeklyData: WeeklyData[];
  targets: Target[];
  schedule: TrainingSchedule[];
  journals: JournalArticle[];
  vitalityHistory: { day: string; vitality: number; recovery: number }[];
  weeklyHealthReport: typeof defaultHealthReport;
  importedFiles: ImportedFile[];
  chatMessages: ChatMessage[];
}

interface DataContextType {
  state: AppState;
  updateProfile: (profile: UserProfile) => void;
  updateDailyMetrics: (metrics: DailyMetrics) => void;
  addDailyMetrics: (metrics: DailyMetrics) => void;
  addRunSession: (session: RunSession) => void;
  removeRunSession: (id: string) => void;
  updateTargets: (targets: Target[]) => void;
  updateSchedule: (schedule: TrainingSchedule[]) => void;
  addImportedFile: (file: ImportedFile) => void;
  removeImportedFile: (id: string) => void;
  addChatMessage: (message: ChatMessage) => void;
  clearAllData: () => void;
  resetWorkoutData: () => void;
  resetDailyData: () => void;
  exportAllData: () => string;
  importAllData: (data: string) => boolean;
}

const STORAGE_KEY = 'pulserun_data_v2';

const defaultChatMessages: ChatMessage[] = [
  {
    id: 'init-1',
    role: 'ai',
    content: `Hello! I'm your AI Running Coach & Sports Medicine Advisor (acting as Sp.KO specialist). Your data is loaded and ready for analysis. What would you like to discuss?`,
    timestamp: new Date(),
    references: ['Evidence-Based Sports Medicine'],
  },
];

function loadFromStorage(): AppState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        profile: parsed.profile || defaultProfile,
        dailyMetrics: parsed.dailyMetrics || defaultDaily,
        dailyMetricsHistory: parsed.dailyMetricsHistory || [defaultDaily],
        runSessions: parsed.runSessions || defaultRuns,
        weeklyData: parsed.weeklyData || defaultWeekly,
        targets: parsed.targets || defaultTargets,
        schedule: parsed.schedule || defaultSchedule,
        journals: parsed.journals || defaultJournals,
        vitalityHistory: parsed.vitalityHistory || defaultVitality,
        weeklyHealthReport: parsed.weeklyHealthReport || defaultHealthReport,
        importedFiles: parsed.importedFiles || [],
        chatMessages: parsed.chatMessages || defaultChatMessages,
      };
    }
  } catch (e) {
    console.error('Failed to load data from localStorage:', e);
  }
  return {
    profile: defaultProfile,
    dailyMetrics: defaultDaily,
    dailyMetricsHistory: [defaultDaily],
    runSessions: defaultRuns,
    weeklyData: defaultWeekly,
    targets: defaultTargets,
    schedule: defaultSchedule,
    journals: defaultJournals,
    vitalityHistory: defaultVitality,
    weeklyHealthReport: defaultHealthReport,
    importedFiles: [],
    chatMessages: defaultChatMessages,
  };
}

function saveToStorage(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save data to localStorage:', e);
  }
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(loadFromStorage);

  // Auto-save to localStorage whenever state changes
  useEffect(() => {
    saveToStorage(state);
  }, [state]);

  const updateProfile = useCallback((profile: UserProfile) => {
    setState(prev => ({ ...prev, profile }));
  }, []);

  const updateDailyMetrics = useCallback((metrics: DailyMetrics) => {
    setState(prev => ({ ...prev, dailyMetrics: metrics }));
  }, []);

  const addRunSession = useCallback((session: RunSession) => {
    setState(prev => ({
      ...prev,
      runSessions: [session, ...prev.runSessions],
      // Update weekly data based on new session
      weeklyData: prev.weeklyData.map((w, i) =>
        i === 0 ? {
          ...w,
          totalDistance: w.totalDistance + session.distance,
          totalTime: w.totalTime + session.duration,
          trainingLoad: w.trainingLoad + session.trainingLoad,
          runs: w.runs + 1,
        } : w
      ),
      // Update daily metrics with latest run data
      dailyMetrics: {
        ...prev.dailyMetrics,
        avgHR: session.avgHR,
      },
    }));
  }, []);

  const removeRunSession = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      runSessions: prev.runSessions.filter(s => s.id !== id),
    }));
  }, []);

  const updateTargets = useCallback((targets: Target[]) => {
    setState(prev => ({ ...prev, targets }));
  }, []);

  const updateSchedule = useCallback((schedule: TrainingSchedule[]) => {
    setState(prev => ({ ...prev, schedule }));
  }, []);

  const addImportedFile = useCallback((file: ImportedFile) => {
    setState(prev => ({
      ...prev,
      importedFiles: [file, ...prev.importedFiles],
    }));
  }, []);

  const removeImportedFile = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      importedFiles: prev.importedFiles.filter(f => f.id !== id),
    }));
  }, []);

  const addChatMessage = useCallback((message: ChatMessage) => {
    setState(prev => ({
      ...prev,
      chatMessages: [...prev.chatMessages, message],
    }));
  }, []);

  const clearAllData = useCallback(() => {
    const fresh: AppState = {
      profile: defaultProfile,
      dailyMetrics: defaultDaily,
      dailyMetricsHistory: [defaultDaily],
      runSessions: defaultRuns,
      weeklyData: defaultWeekly,
      targets: defaultTargets,
      schedule: defaultSchedule,
      journals: defaultJournals,
      vitalityHistory: defaultVitality,
      weeklyHealthReport: defaultHealthReport,
      importedFiles: [],
      chatMessages: defaultChatMessages,
    };
    setState(fresh);
  }, []);

  const resetWorkoutData = useCallback(() => {
    setState(prev => ({
      ...prev,
      runSessions: [],
      importedFiles: [],
    }));
  }, []);

  const resetDailyData = useCallback(() => {
    setState(prev => ({
      ...prev,
      dailyMetrics: defaultDaily,
      dailyMetricsHistory: [defaultDaily],
    }));
  }, []);

  const addDailyMetrics = useCallback((metrics: DailyMetrics) => {
    setState(prev => {
      // Check if this date already exists in history
      const existingIndex = prev.dailyMetricsHistory.findIndex(m => m.date === metrics.date);
      
      let newHistory: DailyMetrics[];
      if (existingIndex >= 0) {
        // Update existing entry
        newHistory = [...prev.dailyMetricsHistory];
        newHistory[existingIndex] = metrics;
      } else {
        // Add new entry and sort by date
        newHistory = [...prev.dailyMetricsHistory, metrics].sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
      }
      
      return {
        ...prev,
        dailyMetrics: metrics, // Update current daily metrics to the latest
        dailyMetricsHistory: newHistory,
      };
    });
  }, []);

  const exportAllData = useCallback((): string => {
    return JSON.stringify(state, null, 2);
  }, [state]);

  const importAllData = useCallback((data: string): boolean => {
    try {
      const parsed = JSON.parse(data);
      setState({
        profile: parsed.profile || state.profile,
        dailyMetrics: parsed.dailyMetrics || state.dailyMetrics,
        dailyMetricsHistory: parsed.dailyMetricsHistory || state.dailyMetricsHistory,
        runSessions: parsed.runSessions || state.runSessions,
        weeklyData: parsed.weeklyData || state.weeklyData,
        targets: parsed.targets || state.targets,
        schedule: parsed.schedule || state.schedule,
        journals: parsed.journals || state.journals,
        vitalityHistory: parsed.vitalityHistory || state.vitalityHistory,
        weeklyHealthReport: parsed.weeklyHealthReport || state.weeklyHealthReport,
        importedFiles: parsed.importedFiles || state.importedFiles,
        chatMessages: parsed.chatMessages || state.chatMessages,
      });
      return true;
    } catch {
      return false;
    }
  }, [state]);

  return (
    <DataContext.Provider value={{
      state,
      updateProfile,
      updateDailyMetrics,
      addDailyMetrics,
      addRunSession,
      removeRunSession,
      updateTargets,
      updateSchedule,
      addImportedFile,
      removeImportedFile,
      addChatMessage,
      clearAllData,
      resetWorkoutData,
      resetDailyData,
      exportAllData,
      importAllData,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
