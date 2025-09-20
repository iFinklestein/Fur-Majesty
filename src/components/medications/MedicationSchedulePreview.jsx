
import React, { useState, useEffect, useCallback } from "react";
import { format, addDays, startOfDay, endOfDay } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Pill } from "lucide-react";

export default function MedicationSchedulePreview({ medication, startDate }) {
  const [schedulePreview, setSchedulePreview] = useState([]);

  const generateDaySchedule = useCallback((date, frequency) => {
    const doses = [];
    
    // Create a new Date object based on the start of the day for each dose calculation
    // to prevent mutating the original 'date' parameter and ensure dose times
    // are consistently calculated from the start of the day.
    const baseDateForDose = startOfDay(date);

    switch (frequency) {
      case 'once_daily':
        doses.push(new Date(baseDateForDose.setHours(9, 0, 0, 0))); // 9 AM
        break;
      case 'twice_daily':
        doses.push(new Date(baseDateForDose.setHours(9, 0, 0, 0))); // 9 AM
        // Re-create baseDateForDose for the second dose to ensure it starts from the day's beginning
        doses.push(new Date(startOfDay(date).setHours(21, 0, 0, 0))); // 9 PM
        break;
      case 'three_times_daily':
        doses.push(new Date(baseDateForDose.setHours(9, 0, 0, 0))); // 9 AM
        doses.push(new Date(startOfDay(date).setHours(15, 0, 0, 0))); // 3 PM
        doses.push(new Date(startOfDay(date).setHours(21, 0, 0, 0))); // 9 PM
        break;
      case 'weekly':
        // Only on the same day of week as start date
        if (date.getDay() === new Date(startDate).getDay()) {
          doses.push(new Date(baseDateForDose.setHours(9, 0, 0, 0)));
        }
        break;
      case 'monthly':
        // Only on the same day of month as start date
        if (date.getDate() === new Date(startDate).getDate()) {
          doses.push(new Date(baseDateForDose.setHours(9, 0, 0, 0)));
        }
        break;
      default:
        break;
    }
    
    return doses;
  }, [startDate]); // startDate is used in the weekly and monthly calculations

  const generateSchedulePreview = useCallback(() => {
    const preview = [];
    const start = new Date(startDate);
    
    // Generate 30 days of schedule
    for (let i = 0; i < 30; i++) {
      const currentDate = addDays(start, i);
      const daySchedule = generateDaySchedule(currentDate, medication.frequency);
      
      if (daySchedule.length > 0) {
        preview.push({
          date: currentDate,
          doses: daySchedule
        });
      }
    }
    
    setSchedulePreview(preview);
  }, [medication, startDate, generateDaySchedule]); // Dependencies: medication, startDate, and generateDaySchedule

  useEffect(() => {
    if (medication && startDate) {
      generateSchedulePreview();
    }
  }, [medication, startDate, generateSchedulePreview]); // Dependencies: medication, startDate, and generateSchedulePreview

  if (!schedulePreview.length) return null;

  const totalDoses = schedulePreview.reduce((sum, day) => sum + day.doses.length, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-500" />
          30-Day Schedule Preview
        </CardTitle>
        <p className="text-sm text-gray-600">
          {totalDoses} total doses over the next 30 days
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {schedulePreview.slice(0, 14).map((day, index) => (
            <div key={index} className="flex items-center justify-between p-2 rounded border">
              <div>
                <p className="font-medium text-sm">
                  {format(day.date, 'EEE, MMM d')}
                </p>
                <p className="text-xs text-gray-500">
                  {format(day.date, 'yyyy')}
                </p>
              </div>
              <div className="flex gap-1 flex-wrap">
                {day.doses.map((dose, doseIndex) => (
                  <Badge key={doseIndex} variant="outline" className="text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    {format(dose, 'h:mm a')}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
          {schedulePreview.length > 14 && (
            <p className="text-center text-sm text-gray-500 pt-2">
              ... and {schedulePreview.length - 14} more days
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
