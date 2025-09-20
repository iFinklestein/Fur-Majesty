import { useState, useEffect, useMemo } from 'react';
import { Task } from '@/api/entities';
import { User } from '@/api/entities';
import { format, isToday, addDays, isBefore, isAfter } from 'date-fns';

// Helper functions
const sameDay = (dateStr, targetDate) => {
  if (!dateStr) return false;
  return format(new Date(dateStr), 'yyyy-MM-dd') === format(targetDate, 'yyyy-MM-dd');
};

const inRange = (dateStr, startDate, endDate) => {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  return date >= startDate && date <= endDate;
};

const sortByTime = (a, b) => new Date(a.dueAt) - new Date(b.dueAt);

export function useTasksView(now = new Date()) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load tasks once
  useEffect(() => {
    let mounted = true;
    
    const loadTasks = async () => {
      try {
        setError(null);
        const user = await User.me();
        const taskData = await Task.filter({ created_by: user.email }, '-dueAt');
        
        if (mounted) {
          setTasks(taskData);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error loading tasks:", error);
        if (mounted) {
          setError(error.message);
          setLoading(false);
        }
      }
    };

    loadTasks();
    
    return () => {
      mounted = false;
    };
  }, []);

  // Optimistic update function
  const updateTaskOptimistically = (taskId, updates) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId ? { ...task, ...updates } : task
      )
    );
  };

  // Add task function
  const addTask = (newTask) => {
    setTasks(prevTasks => [newTask, ...prevTasks]);
  };

  // Remove task function
  const removeTask = (taskId) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
  };

  // Refresh function
  const refreshTasks = async () => {
    try {
      const user = await User.me();
      const taskData = await Task.filter({ created_by: user.email }, '-dueAt');
      setTasks(taskData);
    } catch (error) {
      console.error("Error refreshing tasks:", error);
    }
  };

  // Extract time value for dependency array
  const nowTime = now.getTime();

  // Memoized task filtering and sorting
  const taskLists = useMemo(() => {
    const todayStr = format(now, 'yyyy-MM-dd');
    const startOfToday = new Date(todayStr);
    const end7Days = addDays(startOfToday, 7);
    
    const openTasks = tasks.filter(t => t.status === 'open');
    
    const today = openTasks
      .filter(t => sameDay(t.dueAt, startOfToday))
      .sort(sortByTime)
      .slice(0, 10);
    
    const upcoming = openTasks
      .filter(t => {
        if (!t.dueAt) return false;
        const taskDate = new Date(t.dueAt);
        return taskDate > startOfToday && taskDate <= end7Days;
      })
      .sort(sortByTime)
      .slice(0, 10);
    
    const overdue = openTasks
      .filter(t => {
        if (!t.dueAt) return false;
        const taskDate = new Date(t.dueAt);
        return taskDate < startOfToday;
      })
      .sort(sortByTime);

    return { today, upcoming, overdue };
  }, [tasks, now, nowTime]);

  return {
    ...taskLists,
    loading,
    error,
    updateTaskOptimistically,
    addTask,
    removeTask,
    refreshTasks
  };
}