
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { useEditState } from "@/lib/edit-state-manager";
import { useToast } from "@/hooks/use-toast";

export default function EditResetButton() {
  const { resetAllSessions, isEditingEnabled, enableEditing } = useEditState();
  const { toast } = useToast();
  
  const handleReset = () => {
    // Reset all edit sessions
    resetAllSessions();
    
    // Ensure editing is enabled
    enableEditing();
    
    // Clear any stuck form states in localStorage
    const editKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('edit_') || key.startsWith('form_')
    );
    editKeys.forEach(key => localStorage.removeItem(key));
    
    // Force page refresh to clear any stuck React states
    window.location.reload();
    
    toast({
      title: "Edit Mode Reset",
      description: "All editing sessions have been reset and page refreshed.",
      duration: 2000
    });
  };
  
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleReset}
      className="fixed top-4 right-4 z-50 bg-white border-2 border-red-200 text-red-600 hover:bg-red-50"
      title="Reset all edit modes and refresh page"
    >
      <RotateCcw className="h-4 w-4 mr-2" />
      Reset Edit Mode
    </Button>
  );
}
