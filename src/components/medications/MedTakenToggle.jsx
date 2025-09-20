
import React, { useState, useEffect, useCallback } from "react";
import { MedDoseLog } from "@/api/entities";
import { User } from "@/api/entities";
import { format, subDays } from "date-fns";
import {
  Pill,
  History,
  CheckCircle2,
  Circle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function MedTakenToggle({ medication, petId, onToggle }) {
  const [takenToday, setTakenToday] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(true);

  const todayISO = format(new Date(), 'yyyy-MM-dd');

  const loadTodayStatus = useCallback(async () => {
    try {
      const user = await User.me();
      const logs = await MedDoseLog.filter({
        created_by: user.email,
        medId: medication.id,
        petId,
        dateISO: todayISO
      });
      setTakenToday(logs.length > 0 && logs[0].taken);
    } catch (error) {
      console.error("Error loading med status:", error);
    } finally {
      setLoading(false);
    }
  }, [medication.id, petId, todayISO]);

  useEffect(() => {
    loadTodayStatus();
  }, [loadTodayStatus]);

  const loadHistory = async () => {
    try {
      const user = await User.me();
      const logs = await MedDoseLog.filter({
        created_by: user.email,
        medId: medication.id,
        petId
      }, '-dateISO', 14);
      setHistory(logs);
    } catch (error) {
      console.error("Error loading history:", error);
    }
  };

  const handleToggle = async () => {
    try {
      const user = await User.me();
      
      if (takenToday) {
        // Remove today's log
        const logs = await MedDoseLog.filter({
          created_by: user.email,
          medId: medication.id,
          petId,
          dateISO: todayISO
        });
        if (logs.length > 0) {
          await MedDoseLog.delete(logs[0].id);
        }
        setTakenToday(false);
      } else {
        // Add today's log
        await MedDoseLog.create({
          petId,
          medId: medication.id,
          dateISO: todayISO,
          taken: true
        });
        setTakenToday(true);
      }
      
      if (onToggle) onToggle();
    } catch (error) {
      console.error("Error toggling med status:", error);
    }
  };

  const getHistoryGrid = () => {
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateISO = format(date, 'yyyy-MM-dd');
      const log = history.find(h => h.dateISO === dateISO);
      days.push({
        date,
        dateISO,
        taken: log?.taken || false
      });
    }
    return days;
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
        <span className="text-sm text-gray-400">Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={takenToday ? "default" : "outline"}
        size="sm"
        onClick={handleToggle}
        className={takenToday ? "bg-green-600 hover:bg-green-700" : ""}
      >
        {takenToday ? (
          <>
            <CheckCircle2 className="w-4 h-4 mr-1" />
            Taken Today
          </>
        ) : (
          <>
            <Circle className="w-4 h-4 mr-1" />
            Mark Taken
          </>
        )}
      </Button>

      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadHistory}
          >
            <History className="w-4 h-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{medication.name} - History</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Last 14 days</p>
            <div className="grid grid-cols-7 gap-2">
              {getHistoryGrid().map((day, index) => (
                <div key={day.dateISO} className="text-center">
                  <div className="text-xs text-gray-500 mb-1">
                    {format(day.date, 'MMM d')}
                  </div>
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                    day.taken 
                      ? 'bg-green-100 border-green-300' 
                      : 'bg-gray-100 border-gray-300'
                  }`}>
                    {day.taken ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-green-600" />
                Taken
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                Missed
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
