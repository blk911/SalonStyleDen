
import { useCallback } from 'react';
import { useEditState } from '@/lib/edit-state-manager';
import { queryClient } from '@/lib/queryClient';

export const useEditReset = () => {
  const { resetAllSessions, enableEditing } = useEditState();
  
  const resetEditMode = useCallback(() => {
    // Reset all active edit sessions
    resetAllSessions();
    
    // Enable editing globally
    enableEditing();
    
    // Clear React Query cache to reset any stale data
    queryClient.clear();
    
    // Clear any edit-related localStorage
    const editKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('edit_') || 
      key.startsWith('form_') || 
      key.startsWith('client_edit_') ||
      key.startsWith('salon_edit_')
    );
    editKeys.forEach(key => localStorage.removeItem(key));
    
    // Reset any global edit flags
    if (typeof window !== 'undefined') {
      (window as any).editMode = undefined;
      (window as any).editingSessions = undefined;
    }
    
    console.log('[Edit Reset] All edit sessions and caches cleared');
    
    return true;
  }, [resetAllSessions, enableEditing]);
  
  const forcePageReset = useCallback(() => {
    resetEditMode();
    // Force page reload after a short delay
    setTimeout(() => {
      window.location.reload();
    }, 100);
  }, [resetEditMode]);
  
  return {
    resetEditMode,
    forcePageReset
  };
};
