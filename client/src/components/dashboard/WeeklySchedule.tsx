import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";

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
      // Mock API save - in real app, this would be an actual API call
      // await apiRequest(`/api/salons/${salonId}/schedule`, {
      //   method: 'PUT',
      //   body: JSON.stringify({ schedule })
      // });
      
      // For now, just simulate a successful save
      await new Promise(r => setTimeout(r, 500));
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      
      if (onScheduleSaved) {
        onScheduleSaved();
      }
    } catch (error) {
      console.error('Failed to save schedule:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardContent className="p-2">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium text-sm">Weekly Schedule</h3>
          <div className="flex items-center gap-2">
            {showSuccess && (
              <span className="text-green-500 text-xs">Schedule saved!</span>
            )}
            <Button 
              size="sm" 
              className="bg-[#FF92A5] hover:bg-[#ff7a92] text-white text-xs h-7 px-2"
              disabled={isSubmitting}
              onClick={handleSaveSchedule}
            >
              {isSubmitting ? 'Saving...' : 'Save Schedule'}
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-1 max-h-[320px] overflow-auto pr-1">
          {schedule.map((day, index) => (
            <div 
              key={day.dayOfWeek} 
              className={`border ${day.isOpen ? 'border-pink-100' : 'border-gray-200 bg-gray-50'} rounded-sm p-1`}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Switch 
                    id={`day-${day.dayOfWeek}`}
                    checked={day.isOpen}
                    onCheckedChange={(checked) => updateDay({ isOpen: checked }, index)}
                    className="data-[state=checked]:bg-[#FF92A5]"
                  />
                  <Label htmlFor={`day-${day.dayOfWeek}`} className="text-xs font-medium">
                    {day.dayName}
                  </Label>
                </div>
                
                {day.isOpen && (
                  <div className="flex items-center gap-1 text-xs">
                    <select 
                      value={day.openTime}
                      onChange={(e) => updateDay({ openTime: e.target.value }, index)}
                      className="border border-gray-200 rounded-sm p-0.5 text-xs"
                    >
                      {["06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00"].map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                    <span>to</span>
                    <select 
                      value={day.closeTime}
                      onChange={(e) => updateDay({ closeTime: e.target.value }, index)}
                      className="border border-gray-200 rounded-sm p-0.5 text-xs"
                    >
                      {["13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"].map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-2 text-center">
          <Button 
            className="bg-[#FF92A5] hover:bg-[#ff7a92] text-white text-xs"
            disabled={isSubmitting}
            onClick={handleSaveSchedule}
          >
            {isSubmitting ? 'Saving...' : 'Save Schedule'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}