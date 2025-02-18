import React, { createContext, useContext, useState, useCallback } from 'react';
import { InterviewAnalysis, NextStepPoint } from '@/lib/types';

interface Path2ContextType {
  editableData: InterviewAnalysis | null;
  setEditableData: (data: InterviewAnalysis | null) => void;
  updateData: (data: Partial<InterviewAnalysis>) => void;
  initialized: boolean;
}

const Path2Context = createContext<Path2ContextType | undefined>(undefined);

export function Path2Provider({ children }: { children: React.ReactNode }) {
  const [editableData, setEditableData] = useState<InterviewAnalysis | null>(null);
  const [initialized, setInitialized] = useState(false);

  const setEditableDataWithInit = useCallback((data: InterviewAnalysis | null) => {
    setEditableData(data);
    setInitialized(!!data);
  }, []);

  const updateData = useCallback((data: Partial<InterviewAnalysis>) => {
    setEditableData(prev => {
      if (!prev || !initialized) return prev;
      
      // Create a deep copy of the previous state
      const newState = JSON.parse(JSON.stringify(prev));
      
      // Merge the updates
      Object.entries(data).forEach(([key, value]) => {
        (newState as any)[key] = value;
      });
      
      console.log('Context updating with:', newState);
      return newState;
    });
  }, [initialized]);

  return (
    <Path2Context.Provider 
      value={{ 
        editableData, 
        setEditableData: setEditableDataWithInit, 
        updateData,
        initialized
      }}
    >
      {children}
    </Path2Context.Provider>
  );
}

export function usePath2Context() {
  const context = useContext(Path2Context);
  if (context === undefined) {
    throw new Error('usePath2Context must be used within a Path2Provider');
  }
  return context;
}
