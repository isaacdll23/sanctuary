type TimeRange = {
  startTime: string;
  durationMinutes: number;
};

/**
 * Convert time string (HH:MM) to minutes since midnight
 */
function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Check if two time ranges overlap
 */
export function hasTimeConflict(
  range1: TimeRange,
  range2: TimeRange,
  excludeTaskId?: string
): boolean {
  const start1 = timeToMinutes(range1.startTime);
  const end1 = start1 + range1.durationMinutes;

  const start2 = timeToMinutes(range2.startTime);
  const end2 = start2 + range2.durationMinutes;

  // Check for overlap: one starts before the other ends
  return !(end1 <= start2 || end2 <= start1);
}

/**
 * Find conflicting tasks in a list
 */
export function findConflictingTasks(
  newTask: TimeRange,
  existingTasks: Array<{ id: string; startTime: string; durationMinutes: number }>,
  excludeTaskId?: string
): Array<{ id: string; title?: string; startTime: string; durationMinutes: number }> {
  return existingTasks.filter((task) => {
    if (excludeTaskId && task.id === excludeTaskId) return false;
    return hasTimeConflict(newTask, {
      startTime: task.startTime,
      durationMinutes: task.durationMinutes,
    });
  });
}

/**
 * Format time for display
 */
export function formatTimeForDisplay(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHour}:${String(minutes).padStart(2, "0")} ${ampm}`;
}

/**
 * Calculate end time from start time and duration
 */
export function calculateEndTime(
  startTime: string,
  durationMinutes: number
): string {
  const start = timeToMinutes(startTime);
  const end = start + durationMinutes;
  const hours = Math.floor(end / 60);
  const minutes = end % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}
