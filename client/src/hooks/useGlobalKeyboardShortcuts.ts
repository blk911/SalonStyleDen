
import { useEffect } from 'react';
import { useEditReset } from './useEditReset';

export const useGlobalKeyboardShortcuts = () => {
  const { forcePageReset } = useEditReset();
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + R = Reset edit mode
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'R') {
        event.preventDefault();
        console.log('[Global Shortcut] Resetting edit mode...');
        forcePageReset();
      }
      
      // Escape key = Exit all edit modes without refresh
      if (event.key === 'Escape' && event.shiftKey) {
        event.preventDefault();
        const { resetAllSessions } = useEditState.getState();
        resetAllSessions();
        console.log('[Global Shortcut] Exited all edit modes');
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [forcePageReset]);
};
