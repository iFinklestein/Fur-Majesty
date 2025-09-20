import React, { useState, useEffect, useCallback } from "react";
import { Pet } from "@/api/entities";
import { VetVisit } from "@/api/entities";
import { Medication } from "@/api/entities";
import { Grooming } from "@/api/entities";
import { FeedingSchedule } from "@/api/entities";
import { Task } from "@/api/entities";
import { User } from "@/api/entities";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, isAfter, isBefore, addDays } from "date-fns";
import {
  Heart,
  Calendar,
  Stethoscope,
  Pill,
  Scissors,
  Plus,
  AlertCircle,
  Clock,
  Star
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import TaskWidget from "../components/tasks/TaskWidget";

// Helper function to delay execution
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export default function Dashboard() {
  const [pets, setPets] = useState([]);
  const [vetVisits, setVetVisits] = useState([]);
  const [medications, setMedications] = useState([]);
  const [groomingAppointments, setGroomingAppointments] = useState([]);
  const [feedingSchedules, setFeedingSchedules] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboardData = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      
      // Load user data first
      console.log("Loading user data...");
      const userData = await User.me();
      setUser(userData);
      
      const userFilter = { created_by: userData.email };

      // Load data one by one with delays, but don't fail entire dashboard if one fails
      console.log("Loading pets...");
      try {
        const petsData = await Pet.filter({ ...userFilter, archived: false }, '-created_date');
        setPets(petsData);
      } catch (error) {
        console.error("Error loading pets:", error);
      }
      await delay(2000);

      console.log("Loading tasks...");
      try {
        const taskData = await Task.filter(userFilter, '-dueAt');
        setTasks(taskData);
      } catch (error) {
        console.error("Error loading tasks:", error);
      }
      await delay(2000);

      console.log("Loading vet visits...");
      try {
        const vetData = await VetVisit.filter(userFilter, '-date', 5);
        setVetVisits(vetData);
      } catch (error) {
        console.error("Error loading vet visits:", error);
      }
      await delay(2000);

      console.log("Loading medications...");
      try {
        const medData = await Medication.filter({ ...userFilter, isActive: true }, '-created_date');
        setMedications(medData);
      } catch (error) {
        console.error("Error loading medications:", error);
      }
      await delay(2000);

      console.log("Loading grooming...");
      try {
        const groomingData = await Grooming.filter(userFilter, '-date', 5);
        setGroomingAppointments(groomingData);
      } catch (error) {
        console.error("Error loading grooming:", error);
      }
      await delay(2000);
      
      console.log("Loading feeding schedules...");
      try {
        const feedingData = await FeedingSchedule.filter(userFilter, '-created_date');
        setFeedingSchedules(feedingData);
      } catch (error) {
        console.error("Error loading feeding schedules:", error);
      }

    } catch (error) {
      console.error("Error loading dashboard data:", error);
      setError("Failed to load dashboard data. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const getUpcomingReminders = () => {
    const reminders = [];
    const today = new Date();
    const nextWeek = addDays(today, 7);

    // Upcoming vet follow-ups
    vetVisits.forEach(visit => {
      if (visit.followUpDate && isAfter(new Date(visit.followUpDate), today) && isBefore(new Date(visit.followUpDate), nextWeek)) {
        const pet = pets.find(p => p.id === visit.petId);
        reminders.push({
          type: 'vet',
          date: visit.followUpDate,
          title: `${pet?.name || 'Pet'} follow-up appointment`,
          description: `Follow-up at ${visit.clinicName}`
        });
      }
    });

    // Medication refills
    medications.forEach(med => {
      if (med.refillByDate && isAfter(new Date(med.refillByDate), today) && isBefore(new Date(med.refillByDate), nextWeek)) {
        const pet = pets.find(p => p.id === med.petId);
        reminders.push({
          type: 'medication',
          date: med.refillByDate,
          title: `Refill ${med.name}`,
          description: `For ${pet?.name || 'Pet'}`
        });
      }
    });

    // Upcoming grooming
    groomingAppointments.forEach(grooming => {
      if (grooming.nextDate && isAfter(new Date(grooming.nextDate), today) && isBefore(new Date(grooming.nextDate), nextWeek)) {
        const pet = pets.find(p => p.id === grooming.petId);
        reminders.push({
          type: 'grooming',
          date: grooming.nextDate,
          title: `${pet?.name || 'Pet'} grooming`,
          description: grooming.type.replace(/_/g, ' ')
        });
      }
    });

    return reminders.sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const upcomingReminders = getUpcomingReminders();

  const handleDataUpdate = () => {
    // Simple reload without aggressive retries
    loadDashboardData();
  };

  if (loading && !pets.length && !tasks.length) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-7xl mx-auto text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-red-800 mb-2">Unable to Load Dashboard</h2>
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={loadDashboardData} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-orange-50 to-pink-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user?.full_name || user?.email}!
            </h1>
            <p className="text-gray-600 mt-1">Here's what's happening with your pets today</p>
          </div>
          <Link to={createPageUrl("Pets")}>
            <Button className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600">
              <Plus className="w-4 h-4 mr-2" />
              Add Pet
            </Button>
          </Link>
        </div>

        {/* Tasks Widget */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              Unified Tasks — Open Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TaskWidget 
              variant="dashboard"
              tasks={tasks}
              pets={pets}
              onTaskUpdate={handleDataUpdate} 
            />
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Active Pets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{pets.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
                <Stethoscope className="w-4 h-4" />
                Vet Visits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">{vetVisits.length}</div>
              <p className="text-xs text-green-600">Total recorded</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-700 flex items-center gap-2">
                <Pill className="w-4 h-4" />
                Active Medications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">{medications.length}</div>
              <p className="text-xs text-purple-600">Currently prescribed</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-pink-700 flex items-center gap-2">
                <Scissors className="w-4 h-4" />
                Grooming Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-pink-900">{groomingAppointments.length}</div>
              <p className="text-xs text-pink-600">Total recorded</p>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Reminders */}
        {upcomingReminders.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" />
                Upcoming This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingReminders.map((reminder, index) => (
                  <Alert key={index} className="border-orange-200 bg-orange-50">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <AlertDescription>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-orange-800">{reminder.title}</p>
                          <p className="text-sm text-orange-600">{reminder.description}</p>
                        </div>
                        <Badge variant="outline" className="text-orange-700 border-orange-300">
                          {format(new Date(reminder.date), 'MMM d')}
                        </Badge>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pet Cards */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">My Pets</h2>
            {pets.length > 0 && (
              <Link to={createPageUrl("Pets")}>
                <Button variant="outline">View All</Button>
              </Link>
            )}
          </div>

          {pets.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No pets added yet</h3>
                <p className="text-gray-600 mb-4">Add your first pet to start tracking their care</p>
                <Link to={createPageUrl("Pets")}>
                  <Button className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Pet
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pets.slice(0, 6).map((pet) => (
                <Link key={pet.id} to={createPageUrl(`PetDetail?petId=${pet.id}`)}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        {pet.photoUrl ? (
                          <Avatar className="w-16 h-16">
                            <AvatarImage src={pet.photoUrl} alt={pet.name} />
                            <AvatarFallback className="bg-orange-200 text-orange-700 text-xl">
                              {pet.name[0]}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="w-16 h-16 bg-gradient-to-r from-orange-200 to-pink-200 rounded-full flex items-center justify-center">
                            <span className="text-orange-700 font-bold text-xl">{pet.name[0]}</span>
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{pet.name}</h3>
                          <p className="text-sm text-gray-600 capitalize">
                            {pet.breed ? `${pet.breed}` : pet.species}
                          </p>
                          {pet.dob && (
                            <p className="text-xs text-gray-500">
                              Born {format(new Date(pet.dob), 'MMM yyyy')}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}