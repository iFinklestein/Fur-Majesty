
import React, { useState, useEffect, useCallback } from "react";
import { Task } from "@/api/entities";
import { Pet } from "@/api/entities";
import { User } from "@/api/entities";
import { format, isToday, isFuture, isPast, startOfDay, addDays } from "date-fns";
import {
  CheckSquare,
  Plus,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  Square
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { scheduleGenerateTodayTasks } from "@/components/utils/taskGenerator";

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    petId: null,
    dueAt: new Date().toISOString(),
    notes: ""
  });

  const loadPageData = useCallback(async () => {
    setLoading(true);
    try {
      // Schedule task generation (debounced)
      scheduleGenerateTodayTasks();
      const user = await User.me();
      const [taskData, petData] = await Promise.all([
        Task.filter({ created_by: user.email }, '-dueAt'),
        Pet.filter({ created_by: user.email, archived: false })
      ]);
      setTasks(taskData);
      setPets(petData);
    } catch (error) {
      console.error("Error loading tasks page:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPageData();
  }, [loadPageData]);

  const handleToggleComplete = async (task) => {
    try {
      const newStatus = task.status === 'done' ? 'open' : 'done';
      await Task.update(task.id, { 
        status: newStatus,
        completedAt: newStatus === 'done' ? new Date().toISOString() : null
      });
      await loadPageData(); // Refresh list
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await Task.create({
        ...formData,
        dueAt: new Date(formData.dueAt).toISOString()
      });
      setShowAddDialog(false);
      resetForm();
      await loadPageData();
    } catch (error) {
      console.error("Error creating manual task:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      petId: null,
      dueAt: new Date().toISOString(),
      notes: ""
    });
  }

  const handleClearCompleted = useCallback(async () => {
    const completedTasks = tasks.filter(t => t.status === 'done');
    if (completedTasks.length === 0) return;

    if (window.confirm(`Are you sure you want to remove all ${completedTasks.length} completed tasks? This cannot be undone.`)) {
      // Optimistic UI update
      setTasks(prevTasks => prevTasks.filter(t => t.status !== 'done'));
      
      try {
        const deletePromises = completedTasks.map(task => Task.delete(task.id));
        await Promise.all(deletePromises);
        // No need to call loadPageData() again due to optimistic update as we already filtered them out
      } catch (error) {
        console.error("Error clearing completed tasks:", error);
        alert("Failed to clear completed tasks. Refreshing the list.");
        loadPageData(); // Re-fetch on error to sync state
      }
    }
  }, [tasks, loadPageData]);

  const getTaskLists = () => {
    const today = startOfDay(new Date());
    const nextWeek = addDays(today, 7);
    
    const overdue = tasks.filter(t => t.status === 'open' && t.dueAt && new Date(t.dueAt) < today).sort((a,b) => new Date(a.dueAt) - new Date(b.dueAt));
    const todayTasks = tasks.filter(t => t.status === 'open' && t.dueAt && isToday(new Date(t.dueAt))).sort((a,b) => new Date(a.dueAt) - new Date(b.dueAt));
    const upcoming = tasks.filter(t => t.status === 'open' && t.dueAt && new Date(t.dueAt) > today && new Date(t.dueAt) <= nextWeek).sort((a,b) => new Date(a.dueAt) - new Date(b.dueAt));
    const completed = tasks.filter(t => t.status === 'done').sort((a,b) => new Date(b.completedAt) - new Date(a.completedAt));

    return { overdue, today: todayTasks, upcoming, completed };
  };

  const { overdue, today, upcoming, completed } = getTaskLists();

  const TaskRow = ({ task, isDone = false }) => {
    const pet = pets.find(p => p.id === task.petId);
    return (
      <div className={`flex items-center gap-3 p-2 rounded hover:bg-gray-50 ${isDone ? 'opacity-60' : ''}`}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleToggleComplete(task)}
          className="p-1"
        >
          {isDone ? (
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          ) : (
            <Square className="w-4 h-4 text-gray-400" />
          )}
        </Button>
        
        {pet && (
          <Avatar className="w-8 h-8">
            <AvatarImage src={pet.photoUrl} />
            <AvatarFallback className="text-xs">{pet?.name?.[0] || '?'}</AvatarFallback>
          </Avatar>
        )}
        
        <div className="flex-1">
          <p className={`text-sm font-medium ${isDone ? 'line-through' : ''}`}>
            {task.title}
          </p>
          <div className="flex gap-2 text-xs text-gray-500">
            {task.dueAt && (
              <span>{format(new Date(task.dueAt), 'MMM d, h:mm a')}</span>
            )}
            {task.source !== 'manual' && <Badge variant="secondary" className="capitalize">{task.source}</Badge>}
          </div>
        </div>
      </div>
    );
  };

  const TaskList = ({ tasks, emptyMessage, isDone = false }) => (
    <div className="space-y-2">
      {tasks.length > 0 ? (
        tasks.map(task => <TaskRow key={task.id} task={task} isDone={isDone} />)
      ) : (
        <p className="text-sm text-gray-500 py-8 text-center">{emptyMessage}</p>
      )}
    </div>
  );

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-orange-50 to-pink-50 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
            <p className="text-gray-600 mt-1">Manage all your pet-related tasks</p>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Manual Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Manual Task</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Form fields for manual task */}
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input id="title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
                </div>
                <div>
                  <Label htmlFor="petId">Pet (optional)</Label>
                  <Select value={formData.petId || ''} onValueChange={value => setFormData({...formData, petId: value || null})}>
                    <SelectTrigger><SelectValue placeholder="Select a pet" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>General Task</SelectItem>
                      {pets.map(pet => <SelectItem key={pet.id} value={pet.id}>{pet.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dueAt">Due Date & Time *</Label>
                  <Input id="dueAt" type="datetime-local" value={format(new Date(formData.dueAt), "yyyy-MM-dd'T'HH:mm")} onChange={e => setFormData({...formData, dueAt: e.target.value})} required />
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="ghost" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                  <Button type="submit">Add Task</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            <Tabs defaultValue="today">
              <TabsList className="w-full justify-start rounded-none border-b p-0 h-auto">
                <TabsTrigger value="today" className="flex-1 rounded-none">Today ({today.length})</TabsTrigger>
                <TabsTrigger value="upcoming" className="flex-1 rounded-none">Upcoming ({upcoming.length})</TabsTrigger>
                <TabsTrigger value="overdue" className="flex-1 rounded-none">Overdue ({overdue.length})</TabsTrigger>
                <TabsTrigger value="completed" className="flex-1 rounded-none relative group pr-20"> {/* Added pr-20 to make space for the button */}
                  Completed ({completed.length})
                  {completed.length > 0 && (
                     <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={(e) => { e.stopPropagation(); handleClearCompleted(); }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity h-6 px-2 text-xs"
                        aria-label="Clear all completed tasks"
                      >
                       Clear All
                     </Button>
                  )}
                </TabsTrigger>
              </TabsList>
              <div className="p-4">
                <TabsContent value="today"><TaskList tasks={today} emptyMessage="No tasks for today." /></TabsContent>
                <TabsContent value="upcoming"><TaskList tasks={upcoming} emptyMessage="No upcoming tasks in the next 7 days." /></TabsContent>
                <TabsContent value="overdue"><TaskList tasks={overdue} emptyMessage="No overdue tasks." /></TabsContent>
                <TabsContent value="completed"><TaskList tasks={completed} emptyMessage="No tasks completed yet." isDone={true} /></TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
