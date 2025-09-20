import { FeedingSchedule } from "@/api/entities";
import { User } from "@/api/entities";

let migrationRun = false;

export async function migrateFeedingTimes() {
  if (migrationRun) return;
  
  try {
    console.log("Starting feeding times migration...");
    const user = await User.me();
    
    // Get all feeding schedules for this user
    const schedules = await FeedingSchedule.filter({ created_by: user.email });
    
    let migrated = 0;
    for (const schedule of schedules) {
      // Check if migration needed: has old timeOfDay field but no times array
      if ((schedule.timeOfDay || schedule.time) && !schedule.times) {
        const oldTime = schedule.timeOfDay || schedule.time;
        
        // Update to new format
        await FeedingSchedule.update(schedule.id, {
          times: [oldTime],
          // Remove old fields
          timeOfDay: undefined,
          time: undefined
        });
        
        migrated++;
      }
    }
    
    if (migrated > 0) {
      console.log(`Migrated ${migrated} feeding schedules to new format`);
    }
    
    migrationRun = true;
  } catch (error) {
    console.error("Error during feeding times migration:", error);
  }
}