import React, { useState, useEffect } from "react";
import { FeedingSchedule } from "@/api/entities";
import { Pet } from "@/api/entities";
import { User } from "@/api/entities";
import { format } from "date-fns";
import {
  UtensilsCrossed,
  Plus,
  Edit,
  Trash2,
  Clock,
  X
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { scheduleGenerateTodayTasks } from "@/components/utils/taskGenerator";
import { migrateFeedingTimes } from "@/components/utils/migrateFeedingTimes";

export default function FeedingPage() {
  const [feedingSchedules, setFeedingSchedules] = useState([]);
  const [pets, setPets] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    petId: "",
    times: ["08:00"],
    amount: "",
    notes: "",
    active: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Run migration first
      await migrateFeedingTimes();
      
      const user = await User.me();
      const [scheduleData, petData] = await Promise.all([
        FeedingSchedule.filter({ created_by: user.email }, '-created_date'),
        Pet.filter({ created_by: user.email, archived: false }, '-created_date')
      ]);
      setFeedingSchedules(scheduleData);
      setPets(petData);
    } catch (error) {
      console.error("Error loading data:", error);
      setFeedingSchedules([]);
      setPets([]);
    } finally {
      setLoading(false);
    }
  };

  const syncTaskWithSchedule = async (schedule, action = 'update') => {
    try {
      scheduleGenerateTodayTasks();
    } catch (error) {
      console.error("Error syncing task with schedule:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate times
    const uniqueTimes = [...new Set(formData.times)];
    if (uniqueTimes.length !== formData.times.length) {
      alert("All feeding times must be unique");
      return;
    }

    const prevSchedules = [...feedingSchedules];
    setShowDialog(false);

    try {
      let tempScheduleId;
      let submittedSchedule;

      if (editingSchedule) {
        setFeedingSchedules(currentSchedules =>
          currentSchedules.map(s =>
            s.id === editingSchedule.id ? { ...s, ...formData } : s
          )
        );
        submittedSchedule = { ...editingSchedule, ...formData };
        await FeedingSchedule.update(editingSchedule.id, formData);
      } else {
        tempScheduleId = `temp-${Date.now()}`;
        const newSchedule = { id: tempScheduleId, ...formData };
        setFeedingSchedules(currentSchedules => [...currentSchedules, newSchedule]);
        submittedSchedule = newSchedule;
        
        const createdSchedule = await FeedingSchedule.create(formData);
        setFeedingSchedules(currentSchedules =>
          currentSchedules.map(s =>
            s.id === tempScheduleId ? createdSchedule : s
          )
        );
        submittedSchedule = createdSchedule;
      }
      
      await syncTaskWithSchedule(submittedSchedule, 'update');
      resetForm();
    } catch (error) {
      console.error("Error saving feeding schedule:", error);
      setFeedingSchedules(prevSchedules);
      setShowDialog(true);
    }
  };

  const resetForm = () => {
    setFormData({
      petId: "",
      times: ["08:00"],
      amount: "",
      notes: "",
      active: true
    });
    setEditingSchedule(null);
    setShowDialog(false);
  };

  const handleEdit = (schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      ...schedule,
      times: schedule.times || (schedule.timeOfDay ? [schedule.timeOfDay] : ["08:00"])
    });
    setShowDialog(true);
  };

  const handleDelete = async (scheduleId) => {
    if (window.confirm("Are you sure you want to delete this feeding schedule?")) {
      const prevSchedules = [...feedingSchedules];
      const scheduleToDelete = prevSchedules.find(s => s.id === scheduleId);

      setFeedingSchedules(currentSchedules =>
        currentSchedules.filter(s => s.id !== scheduleId)
      );

      try {
        if (scheduleToDelete) {
          await syncTaskWithSchedule(scheduleToDelete, 'delete');
        }
        await FeedingSchedule.delete(scheduleId);
      } catch (error) {
        console.error("Error deleting feeding schedule:", error);
        setFeedingSchedules(prevSchedules);
      }
    }
  };

  const handleTimesCountChange = (count) => {
    const newCount = parseInt(count);
    const currentTimes = [...formData.times];
    
    if (newCount > currentTimes.length) {
      // Add more times
      while (currentTimes.length < newCount) {
        const lastTime = currentTimes[currentTimes.length - 1] || "08:00";
        const [hours, minutes] = lastTime.split(':').map(Number);
        const nextHour = Math.min(23, hours + 4);
        currentTimes.push(`${String(nextHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
      }
    } else if (newCount < currentTimes.length) {
      // Remove times
      currentTimes.splice(newCount);
    }
    
    setFormData(prev => ({ ...prev, times: currentTimes }));
  };

  const updateTime = (index, newTime) => {
    const newTimes = [...formData.times];
    newTimes[index] = newTime;
    setFormData(prev => ({ ...prev, times: newTimes }));
  };

  const formatTimeDisplay = (timeString) => {
    try {
      return format(new Date(`2000-01-01T${timeString}`), 'h:mm a');
    } catch {
      return timeString;
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="space-y-4">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-orange-50 to-pink-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Feeding Schedule</h1>
            <p className="text-gray-600 mt-1">Manage your pets' recurring feeding times</p>
          </div>
          <Dialog open={showDialog} onOpenChange={(isOpen) => {
              if (!isOpen) {
                  resetForm();
              }
              setShowDialog(isOpen);
          }}>
            <DialogTrigger asChild>
              <Button 
                disabled={pets.length === 0}
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Schedule
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{editingSchedule ? 'Edit Feeding Schedule' : 'Add Feeding Schedule'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="petId">Pet *</Label>
                  <Select
                    value={formData.petId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, petId: value }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select pet" />
                    </SelectTrigger>
                    <SelectContent>
                      {pets.map((pet) => (
                        <SelectItem key={pet.id} value={pet.id}>
                          {pet.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="timesCount">Times per day *</Label>
                  <Select
                    value={String(formData.times.length)}
                    onValueChange={handleTimesCountChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1,2,3,4,5,6].map(count => (
                        <SelectItem key={count} value={String(count)}>
                          {count} time{count > 1 ? 's' : ''} per day
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Feeding Times *</Label>
                  <div className="space-y-2">
                    {formData.times.map((time, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={time}
                          onChange={(e) => updateTime(index, e.target.value)}
                          required
                          className="flex-1"
                        />
                        <span className="text-sm text-gray-500 min-w-16">
                          {formatTimeDisplay(time)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="amount">Amount *</Label>
                  <Input
                    id="amount"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="e.g., 1 cup, 200g"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Special feeding instructions..."
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
                  />
                  <Label htmlFor="active">Active Schedule</Label>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500">
                    {editingSchedule ? 'Update Schedule' : 'Add Schedule'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {pets.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <UtensilsCrossed className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No pets found</h3>
              <p className="text-gray-600 mb-4">Add a pet first to set up feeding schedules</p>
              <Button variant="outline" onClick={() => {/* Navigate to pets page */}}>
                Go to Pets
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Feeding Schedules */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UtensilsCrossed className="w-5 h-5 text-orange-500" />
                  Feeding Schedules
                </CardTitle>
              </CardHeader>
              <CardContent>
                {feedingSchedules.length === 0 ? (
                  <div className="text-center py-8">
                    <UtensilsCrossed className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No feeding schedules yet</h3>
                    <p className="text-gray-600 mb-4">Add one to auto-create daily tasks.</p>
                    <Button 
                      onClick={() => setShowDialog(true)}
                      className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Schedule
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {feedingSchedules.map((schedule) => {
                      const pet = pets.find(p => p.id === schedule.petId);
                      const times = schedule.times || (schedule.timeOfDay ? [schedule.timeOfDay] : []);
                      
                      return (
                        <div
                          key={schedule.id}
                          className={`border rounded-lg p-4 group hover:shadow-md transition-shadow ${!schedule.active ? 'opacity-60 bg-gray-50' : ''}`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-12 h-12">
                                <AvatarImage src={pet?.photoUrl} />
                                <AvatarFallback>{pet?.name?.[0] || 'P'}</AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="font-semibold">{pet?.name || 'Unknown Pet'}</h3>
                                <div className="flex items-center gap-2 text-sm text-gray-600 flex-wrap">
                                  <Clock className="w-4 h-4" />
                                  {times.map((time, index) => (
                                    <React.Fragment key={time}>
                                      <span>{formatTimeDisplay(time)}</span>
                                      {index < times.length - 1 && <span>·</span>}
                                    </React.Fragment>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={schedule.active ? "secondary" : "outline"}>
                                {schedule.active ? 'Active' : 'Inactive'}
                              </Badge>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(schedule)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(schedule.id)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>

                          <div className="text-sm">
                            <div className="mb-2">
                              <strong>Amount:</strong> {schedule.amount}
                            </div>
                            {schedule.notes && (
                              <div className="p-2 bg-gray-50 rounded text-gray-700">
                                <strong>Notes:</strong> {schedule.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}