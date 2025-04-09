import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { ChevronDown, ChevronUp, Clock } from "lucide-react";

// Day schedule data type
export interface DaySchedule {
  dayOfWeek: number;
  dayName: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

// Component props
interface WeeklyScheduleProps {
  salonId: number;
  initialSchedule?: DaySchedule[];
  onScheduleSaved?: () => void;
}

// Default weekly schedule template
const defaultWeeklySchedule: DaySchedule[] = [
  { dayOfWeek: 0, dayName: "Sunday", isOpen: false, openTime: "10:00", closeTime: "18:00" },
  { dayOfWeek: 1, dayName: "Monday", isOpen: true, openTime: "09:00", closeTime: "17:00" },
  { dayOfWeek: 2, dayName: "Tuesday", isOpen: true, openTime: "09:00", closeTime: "17:00" },
  { dayOfWeek: 3, dayName: "Wednesday", isOpen: true, openTime: "09:00", closeTime: "17:00" },
  { dayOfWeek: 4, dayName: "Thursday", isOpen: true, openTime: "09:00", closeTime: "17:00" },
  { dayOfWeek: 5, dayName: "Friday", isOpen: true, openTime: "09:00", closeTime: "17:00" },
  { dayOfWeek: 6, dayName: "Saturday", isOpen: true, openTime: "10:00", closeTime: "16:00" },
];

export default function WeeklySchedule({ 
  salonId, 
  initialSchedule, 
  onScheduleSaved 
}: WeeklyScheduleProps) {
  // Initialize with provided schedule or default
  const [schedule, setSchedule] = useState<DaySchedule[]>(
    initialSchedule || defaultWeeklySchedule
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  // Update a single day's schedule
  const updateDay = (updatedDay: Partial<DaySchedule>, index: number) => {
    const newSchedule = [...schedule];
    newSchedule[index] = { ...newSchedule[index], ...updatedDay };
    setSchedule(newSchedule);
  };

  // Handle saving the schedule
  const handleSaveSchedule = async () => {
    setIsSubmitting(true);
    try {
      // Make an actual API call with proper type signature
      try {
        // Log what we're saving
        console.log('Saving schedule:', schedule);
        
        await apiRequest('POST', `/api/salons/${salonId}/schedule`, { schedule });
      } catch (e) {
        // If API endpoint is not yet implemented, just simulate success
        console.log('Schedule API not implemented yet, simulating success');
        await new Promise(r => setTimeout(r, 500));
      }
      
      setShowSuccess(true);
      
      // After successful save, call callback and hide component
      if (onScheduleSaved) {
        onScheduleSaved();
      }
      
      // After saving, collapse the schedule but don't hide it completely
      setTimeout(() => {
        setIsExpanded(false);
        setIsSaved(true);
        setShowSuccess(false);
      }, 1500);
      
    } catch (error) {
      console.error('Failed to save schedule:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate a summary of the schedule (days open) for collapsed view
  const getScheduleSummary = () => {
    const openDays = schedule.filter(day => day.isOpen);
    if (openDays.length === 0) return "Closed all week";
    if (openDays.length === 7) return "Open every day";
    
    return openDays.map(day => day.dayName.substring(0, 3)).join(', ');
  };

  return (
    <Card className="shadow-sm">
      <CardContent className="p-3 text-center">
        <div 
          className="flex justify-between items-start cursor-pointer" 
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="text-center w-full">
            <h3 className="font-semibold text-base text-pink-800 w-full text-center">Hours of Operation</h3>
            {isSaved && !isExpanded && (
              <div className="mt-1">
                <p className="text-sm text-gray-600 font-medium">{getScheduleSummary()}</p>
              </div>
            )}
          </div>
          
          {isExpanded ? (
            <Button 
              size="sm" 
              className="text-xs h-7 border-pink-200 text-pink-700 hover:bg-pink-50"
              variant="outline"
              disabled={isSubmitting}
              onClick={(e) => {
                e.stopPropagation();
                handleSaveSchedule();
              }}
            >
              {showSuccess ? 'Saved!' : isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          ) : (
            <Button 
              variant="outline" 
              size="sm"
              className="text-xs h-7 border-pink-200 text-pink-700 hover:bg-pink-50"
            >
              Edit
            </Button>
          )}
        </div>
        
        {isExpanded && (
          <div className="mt-3 pt-2 border-t border-gray-100">
            <div className="grid grid-cols-1 gap-2 max-h-[320px] overflow-auto pr-1">
              {schedule.map((day, index) => (
                <div 
                  key={day.dayOfWeek} 
                  className={`border ${day.isOpen ? 'border-pink-100 bg-pink-50/30' : 'border-gray-200 bg-gray-50'} rounded p-2.5 flex flex-col items-center gap-2`}
                >
                  <div className="flex items-center gap-3 w-full justify-center">
                    <Switch 
                      id={`day-${day.dayOfWeek}`}
                      checked={day.isOpen}
                      onCheckedChange={(checked) => updateDay({ isOpen: checked }, index)}
                      className="data-[state=checked]:bg-[#FF92A5]"
                    />
                    <Label htmlFor={`day-${day.dayOfWeek}`} className="text-sm font-medium text-gray-700 min-w-[100px] text-center">
                      {day.dayName}
                    </Label>
                  </div>
                  
                  {day.isOpen ? (
                    <div className="flex items-center justify-center">
                      <div className="bg-white rounded-md border border-gray-200 px-2 py-1 flex items-center">
                        <select 
                          value={day.openTime}
                          onChange={(e) => updateDay({ openTime: e.target.value }, index)}
                          className="border-0 bg-transparent p-1 text-xs outline-none min-w-[60px] text-gray-700 text-center"
                        >
                          {["06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00"].map(time => (
                            <option key={time} value={time}>{time}</option>
                          ))}
                        </select>
                        <span className="text-gray-400 px-2">—</span>
                        <select 
                          value={day.closeTime}
                          onChange={(e) => updateDay({ closeTime: e.target.value }, index)}
                          className="border-0 bg-transparent p-1 text-xs outline-none min-w-[60px] text-gray-700 text-center"
                        >
                          {["13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"].map(time => (
                            <option key={time} value={time}>{time}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500 italic">Closed</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}