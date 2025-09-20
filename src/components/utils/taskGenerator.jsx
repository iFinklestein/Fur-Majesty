import { Task } from "@/api/entities";
import { FeedingSchedule } from "@/api/entities";
import { Medication } from "@/api/entities";
import { VetVisit } from "@/api/entities";
import { User } from "@/api/entities";
import { format, startOfDay, endOfDay } from "date-fns";

// Module-level guards
let isGenerating = false;
let pending = false;
let timer = null;

// Helper function to delay execution
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to retry API calls with exponential backoff
const retryWithBackoff = async (fn, maxRetries = 2, baseDelay = 2000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.message?.includes('429') || error.message?.includes('Rate limit')) {
        const delayMs = baseDelay * Math.pow(2, i);
        console.warn(`Rate limit hit. Retrying in ${delayMs}ms...`);
        await delay(delayMs);
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
};

// Helper to create a unique key for a task to prevent duplicates
const getTaskKey = (source, refId, date) => `${source}:${refId}:${format(new Date(date), 'yyyy-MM-dd')}`;

// Debounced public interface
export function scheduleGenerateTodayTasks(opts = {}) {
  // debounce 200ms; coalesce multiple calls
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => runGenerate(opts), 200);
}

// Internal generation function
async function runGenerate({ now = new Date() } = {}) {
  if (isGenerating) {
    pending = true;
    return;
  }
  
  isGenerating = true;
  console.log("Starting debounced task generation...");
  
  try {
    const user = await User.me();
    const todayISO = format(now, 'yyyy-MM-dd');
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    // 1) Fetch data sequentially to avoid rate limits
    const existingTasks = await retryWithBackoff(() => 
      Task.filter({ 
        created_by: user.email, 
        dueAt: { $gte: todayStart.toISOString(), $lte: todayEnd.toISOString() } 
      })
    );
    await delay(500);
    const feedingSchedules = await retryWithBackoff(() => FeedingSchedule.filter({ created_by: user.email, active: true }));
    await delay(500);
    const medications = await retryWithBackoff(() => Medication.filter({ created_by: user.email, isActive: true }));
    await delay(500);
    const vetVisits = await retryWithBackoff(() => VetVisit.filter({ created_by: user.email }));

    // 2) Build index of existing task keys
    const existingTaskKeys = new Set(
      existingTasks.map(task => getTaskKey(task.source || 'manual', task.sourceRefId || '', task.dueAt))
    );

    const newTasks = [];

    // 3) Generate feeding tasks - NEW: support multiple times per schedule
    for (const schedule of feedingSchedules) {
      // Handle both old and new format during transition
      const feedingTimes = schedule.times || (schedule.timeOfDay ? [schedule.timeOfDay] : []);
      
      for (const time of feedingTimes) {
        const dueAt = new Date(`${todayISO}T${time}`);
        const taskKey = getTaskKey('feeding', schedule.id, dueAt);

        if (!existingTaskKeys.has(taskKey)) {
          newTasks.push({
            petId: schedule.petId,
            title: `Feed (${schedule.amount})`,
            dueAt: dueAt.toISOString(),
            status: 'open',
            source: 'feeding',
            sourceRefId: schedule.id,
          });
        }
      }
    }

    // 4) Generate medication tasks
    for (const med of medications) {
      const dueAt = new Date(`${todayISO}T08:00:00`);
      const taskKey = getTaskKey('med', med.id, dueAt);

      if (!existingTaskKeys.has(taskKey)) {
        newTasks.push({
          petId: med.petId,
          title: `Give ${med.name}`,
          dueAt: dueAt.toISOString(),
          status: 'open',
          source: 'med',
          sourceRefId: med.id,
        });
      }
    }

    // 5) Generate vet visit tasks (only for today)
    const todayVetVisits = vetVisits.filter(visit => 
      visit.date && format(new Date(visit.date), 'yyyy-MM-dd') === todayISO
    );
    
    for (const visit of todayVetVisits) {
      const visitDate = new Date(visit.date);
      const dueAt = new Date(visitDate.getFullYear(), visitDate.getMonth(), visitDate.getDate(), 9, 0, 0);
      const taskKey = getTaskKey('vet', visit.id, dueAt);

      if (!existingTaskKeys.has(taskKey)) {
        newTasks.push({
          petId: visit.petId,
          title: `Vet appointment: ${visit.reason}`,
          dueAt: dueAt.toISOString(),
          status: 'open',
          source: 'vet',
          sourceRefId: visit.id,
        });
      }
    }

    // 6) Batch create new tasks
    if (newTasks.length > 0) {
      console.log(`Generating ${newTasks.length} new tasks.`);
      await Task.bulkCreate(newTasks);
    } else {
      console.log("No new tasks to generate.");
    }

  } catch (error) {
    console.error("Error during task generation:", error);
  } finally {
    isGenerating = false;
    if (pending) {
      pending = false;
      // Process any pending requests
      setTimeout(() => runGenerate({ now }), 50);
    }
    console.log("Task generation finished.");
  }
}