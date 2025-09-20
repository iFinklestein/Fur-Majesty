import { Task } from "@/api/entities";
import { User } from "@/api/entities";
import { subDays, isBefore } from 'date-fns';

let isPurging = false;

export async function scheduleAutoPurge() {
  if (isPurging) {
    console.log("Purge already in progress.");
    return;
  }
  
  isPurging = true;
  console.log("Starting automatic task purge...");

  try {
    const user = await User.me();
    const retentionDays = user.taskHistoryRetentionDays;

    if (!retentionDays || retentionDays <= 0) {
      console.log("Auto-purge is disabled. Exiting.");
      return;
    }

    const cutoffDate = subDays(new Date(), retentionDays);
    
    // Fetch all completed tasks for the user
    const completedTasks = await Task.filter({ 
      created_by: user.email, 
      status: 'done' 
    });

    const tasksToPurge = completedTasks.filter(task => 
      task.completedAt && isBefore(new Date(task.completedAt), cutoffDate)
    );

    if (tasksToPurge.length === 0) {
      console.log("No old completed tasks to purge.");
      return;
    }

    console.log(`Purging ${tasksToPurge.length} completed tasks older than ${retentionDays} days.`);

    // Delete tasks in chunks to avoid overwhelming the API
    const deletePromises = tasksToPurge.map(task => Task.delete(task.id));
    await Promise.all(deletePromises);

    console.log("Purge completed successfully.");

  } catch (error) {
    console.error("Error during automatic task purge:", error);
    // Optionally, show a non-blocking toast to the user
  } finally {
    isPurging = false;
  }
}