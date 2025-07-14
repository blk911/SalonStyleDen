
// Edit State Manager - Centralized editing state management
import { create } from 'zustand';

interface EditState {
  isEditingEnabled: boolean;
  activeEditSessions: Set<string>;
  enableEditing: () => void;
  disableEditing: () => void;
  startEditSession: (componentId: string) => void;
  endEditSession: (componentId: string) => void;
  isComponentEditing: (componentId: string) => boolean;
  resetAllSessions: () => void;
}

export const useEditState = create<EditState>((set, get) => ({
  isEditingEnabled: true,
  activeEditSessions: new Set(),
  
  enableEditing: () => set({ isEditingEnabled: true }),
  disableEditing: () => set({ isEditingEnabled: false }),
  
  startEditSession: (componentId: string) => {
    const { activeEditSessions } = get();
    const newSessions = new Set(activeEditSessions);
    newSessions.add(componentId);
    set({ activeEditSessions: newSessions });
  },
  
  endEditSession: (componentId: string) => {
    const { activeEditSessions } = get();
    const newSessions = new Set(activeEditSessions);
    newSessions.delete(componentId);
    set({ activeEditSessions: newSessions });
  },
  
  isComponentEditing: (componentId: string) => {
    const { activeEditSessions } = get();
    return activeEditSessions.has(componentId);
  },
  
  resetAllSessions: () => {
    set({ 
      activeEditSessions: new Set(),
      isEditingEnabled: true 
    });
  }
}));

// Hook for easy component integration
export const useEditMode = (componentId: string) => {
  const { 
    isEditingEnabled, 
    startEditSession, 
    endEditSession, 
    isComponentEditing 
  } = useEditState();
  
  const isEditing = isComponentEditing(componentId);
  
  const enterEditMode = () => startEditSession(componentId);
  const exitEditMode = () => endEditSession(componentId);
  
  return {
    isEditingEnabled,
    isEditing,
    enterEditMode,
    exitEditMode
  };
};
