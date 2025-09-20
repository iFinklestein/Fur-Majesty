
import React, { useState, useEffect, useCallback } from "react";
import { Pet } from "@/api/entities";
import { MedicationDose } from "@/api/entities";
import { FeedingSchedule } from "@/api/entities";
import { Reminder } from "@/api/entities";
import { User } from "@/api/entities";
import { format, startOfDay, endOfDay, isBefore } from "date-fns";
import {
  Clock,
  Pill,
  UtensilsCrossed,
  AlertCircle,
  CheckCircle2,
  Calendar
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function TodaysDashboard({ selectedPetId = null, onTaskUpdate }) {
  const [todaysTasks, setTodaysTasks] = useState({
    medications: [],
    feedings: [],
    reminders: []
  });
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTodaysTasks = useCallback(async () => {
    setLoading(true);
    try {
      const user = await User.me();
      const today = new Date();
      const dayStart = startOfDay(today);
      const dayEnd = endOfDay(today);

      // Load pets
      const allPets = await Pet.filter({ created_by: user.email }, '-created_date');
      setPets(allPets);

      const petFilter = selectedPetId ? { petId: selectedPetId } : {};

      // Load today's medication doses
      const medications = await MedicationDose.filter({
        created_by: user.email,
        ...petFilter
      }, '-scheduledDateTime');

      const todaysMeds = medications.filter(med => {
        const scheduleDate = new Date(med.scheduledDateTime);
        return scheduleDate >= dayStart && scheduleDate <= dayEnd;
      });

      // Load today's feedings
      const feedings = await FeedingSchedule.filter({
        created_by: user.email,
        ...petFilter
      }, '-scheduledDateTime');

      const todaysFeedings = feedings.filter(feeding => {
        const scheduleDate = new Date(feeding.scheduledDateTime);
        return scheduleDate >= dayStart && scheduleDate <= dayEnd;
      });

      // Load active reminders
      const reminders = await Reminder.filter({
        created_by: user.email,
        status: 'active',
        ...petFilter
      }, '-scheduledDateTime');

      const todaysReminders = reminders.filter(reminder => {
        const scheduleDate = new Date(reminder.scheduledDateTime);
        return scheduleDate >= dayStart && scheduleDate <= dayEnd;
      });

      setTodaysTasks({
        medications: todaysMeds,
        feedings: todaysFeedings,
        reminders: todaysReminders
      });
    } catch (error) {
      console.error("Error loading today's tasks:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedPetId]);

  useEffect(() => {
    loadTodaysTasks();
  }, [loadTodaysTasks]);

  const handleMedicationToggle = async (dose) => {
    try {
      const newStatus = dose.status === 'taken' ? 'pending' : 'taken';
      const updateData = {
        ...dose,
        status: newStatus,
        actualDateTime: newStatus === 'taken' ? new Date().toISOString() : null
      };
      
      await MedicationDose.update(dose.id, updateData);
      await loadTodaysTasks();
      if (onTaskUpdate) onTaskUpdate();
    } catch (error) {
      console.error("Error updating medication:", error);
    }
  };

  const handleFeedingToggle = async (feeding) => {
    try {
      const newStatus = feeding.status === 'completed' ? 'pending' : 'completed';
      const updateData = {
        ...feeding,
        status: newStatus,
        actualDateTime: newStatus === 'completed' ? new Date().toISOString() : null
      };
      
      await FeedingSchedule.update(feeding.id, updateData);
      await loadTodaysTasks();
      if (onTaskUpdate) onTaskUpdate();
    } catch (error) {
      console.error("Error updating feeding:", error);
    }
  };

  const getPetById = (petId) => pets.find(p => p.id === petId);

  if (loading) {
    return (
      <div className="space-y-4">
        {Array(3).fill(0).map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
        ))}
      </div>
    );
  }

  const allTasksCount = todaysTasks.medications.length + 
                       todaysTasks.feedings.length + 
                       todaysTasks.reminders.length;
  
  const title = selectedPetId ? "Today's Tasks for This Pet" : "Today's Tasks";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <Badge variant="outline" className="text-sm">
          {allTasksCount} {allTasksCount === 1 ? 'task' : 'tasks'} today
        </Badge>
      </div>

      {allTasksCount === 0 ? (
        <Card className="text-center py-8">
          <CardContent>
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">All caught up!</h3>
            <p className="text-gray-600">No tasks scheduled for today</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Medications */}
          {todaysTasks.medications.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="w-5 h-5 text-purple-500" />
                  Medications ({todaysTasks.medications.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {todaysTasks.medications.map((dose) => {
                  const pet = getPetById(dose.petId);
                  const isOverdue = isBefore(new Date(dose.scheduledDateTime), new Date()) && dose.status === 'pending';
                  
                  return (
                    <div key={dose.id} className={`flex items-center justify-between p-3 rounded-lg border ${
                      dose.status === 'taken' ? 'bg-green-50 border-green-200' : 
                      isOverdue ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={pet?.photoUrl} />
                          <AvatarFallback className="text-xs">
                            {pet?.name?.[0] || 'P'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{pet?.name || 'Unknown Pet'}</p>
                          <p className="text-sm text-gray-600">
                            {format(new Date(dose.scheduledDateTime), 'h:mm a')}
                            {isOverdue && <span className="text-red-600 ml-1">(Overdue)</span>}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={dose.status === 'taken' ? 'default' : 'outline'}
                        onClick={() => handleMedicationToggle(dose)}
                        className={dose.status === 'taken' ? 'bg-green-600 hover:bg-green-700' : ''}
                      >
                        {dose.status === 'taken' ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Given
                          </>
                        ) : (
                          'Mark Given'
                        )}
                      </Button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Feedings */}
          {todaysTasks.feedings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UtensilsCrossed className="w-5 h-5 text-orange-500" />
                  Feedings ({todaysTasks.feedings.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {todaysTasks.feedings.map((feeding) => {
                  const pet = getPetById(feeding.petId);
                  const isOverdue = isBefore(new Date(feeding.scheduledDateTime), new Date()) && feeding.status === 'pending';
                  
                  return (
                    <div key={feeding.id} className={`flex items-center justify-between p-3 rounded-lg border ${
                      feeding.status === 'completed' ? 'bg-green-50 border-green-200' : 
                      isOverdue ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={pet?.photoUrl} />
                          <AvatarFallback className="text-xs">
                            {pet?.name?.[0] || 'P'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{pet?.name || 'Unknown Pet'}</p>
                          <p className="text-sm text-gray-600">
                            {format(new Date(feeding.scheduledDateTime), 'h:mm a')}
                            {feeding.amount && ` - ${feeding.amount}`}
                            {isOverdue && <span className="text-red-600 ml-1">(Overdue)</span>}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={feeding.status === 'completed' ? 'default' : 'outline'}
                        onClick={() => handleFeedingToggle(feeding)}
                        className={feeding.status === 'completed' ? 'bg-green-600 hover:bg-green-700' : ''}
                      >
                        {feeding.status === 'completed' ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Fed
                          </>
                        ) : (
                          'Mark Fed'
                        )}
                      </Button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Reminders */}
          {todaysTasks.reminders.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  Reminders ({todaysTasks.reminders.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {todaysTasks.reminders.map((reminder) => {
                  const pet = getPetById(reminder.petId);
                  const isOverdue = isBefore(new Date(reminder.scheduledDateTime), new Date());
                  
                  return (
                    <div key={reminder.id} className={`p-3 rounded-lg border ${
                      isOverdue ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
                    }`}>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={pet?.photoUrl} />
                          <AvatarFallback className="text-xs">
                            {pet?.name?.[0] || 'P'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">{reminder.title}</p>
                          <p className="text-sm text-gray-600">
                            {pet?.name || 'Unknown Pet'} - {format(new Date(reminder.scheduledDateTime), 'h:mm a')}
                          </p>
                          {reminder.description && (
                            <p className="text-sm text-gray-500 mt-1">{reminder.description}</p>
                          )}
                        </div>
                        {isOverdue && (
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
