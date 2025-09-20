import React, { useState } from "react";
import { Task } from "@/api/entities";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  Square
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { useTasksView } from "../hooks/useTasksView";

export default function TaskWidget({ variant = "full", pets = [], onTaskUpdate }) {
  const { today, upcoming, overdue, loading, updateTaskOptimistically, refreshTasks } = useTasksView();
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Set initial loading to false once we get data
  React.useEffect(() => {
    if (!loading) {
      setLoadingInitial(false);
    }
  }, [loading]);

  const handleToggleComplete = async (task) => {
    const newStatus = task.status === 'done' ? 'open' : 'done';
    const updates = {
      status: newStatus,
      completedAt: newStatus === 'done' ? new Date().toISOString() : null
    };

    // Optimistic update - immediately update UI
    updateTaskOptimistically(task.id, updates);
    
    try {
      // Background write
      await Task.update(task.id, updates);
      
      // Callback to parent to trigger refresh if needed
      if (onTaskUpdate) {
        onTaskUpdate();
      }
    } catch (error) {
      console.error("Error updating task:", error);
      // Revert optimistic update on failure
      updateTaskOptimistically(task.id, { 
        status: task.status, 
        completedAt: task.completedAt 
      });
      // Trigger full refresh
      refreshTasks();
    }
  };

  const TaskRow = ({ task }) => {
    const pet = pets.find(p => p.id === task.petId);
    const isTaskOverdue = overdue.some(ot => ot.id === task.id);

    return (
      <div className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleToggleComplete(task)}
          className="p-1"
        >
          <Square className="w-4 h-4 text-gray-400" />
        </Button>
        
        {pet && (
          <Avatar className="w-6 h-6">
            <AvatarImage src={pet.photoUrl} />
            <AvatarFallback className="text-xs">{pet?.name?.[0] || '?'}</AvatarFallback>
          </Avatar>
        )}
        
        <div className="flex-1">
          <p className="text-sm font-medium">
            {task.title}
          </p>
          <div className="flex gap-2 text-xs text-gray-500">
            {task.dueAt && (
              <span>{format(new Date(task.dueAt), 'h:mm a')}</span>
            )}
            {isTaskOverdue && (
              <Badge variant="destructive" className="text-xs">Overdue</Badge>
            )}
            {task.source !== 'manual' && (
              <Badge variant="secondary" className="text-xs capitalize">{task.source}</Badge>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Show skeleton on initial load
  if (loadingInitial) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
          <div className="space-y-2">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  const allTasksEmpty = today.length === 0 && upcoming.length === 0 && overdue.length === 0;

  return (
    <div className="space-y-6">
      {allTasksEmpty && (
        <div className="text-center py-8">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">All Caught Up!</h3>
          <p className="text-gray-600">You have no open tasks.</p>
        </div>
      )}

      {today.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Today ({today.length})
          </h3>
          <div className="space-y-1">
            {today.map(task => (
              <TaskRow key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}
      
      {overdue.length > 0 && variant === 'dashboard' && (
        <div>
          <h3 className="font-semibold text-red-600 mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Overdue ({overdue.length})
          </h3>
          <div className="space-y-1">
            {overdue.slice(0, 5).map(task => (
              <TaskRow key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {upcoming.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Upcoming ({upcoming.length})
          </h3>
          <div className="space-y-1">
            {upcoming.map(task => (
              <TaskRow key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {/* View All Tasks Link */}
      <div className="pt-2 border-t">
        <Link to={createPageUrl("Tasks")}>
          <Button variant="outline" size="sm" className="w-full">
            View All Tasks
          </Button>
        </Link>
      </div>
    </div>
  );
}