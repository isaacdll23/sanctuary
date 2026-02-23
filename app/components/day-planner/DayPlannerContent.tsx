import { useRef } from "react";
import CalendarView from "./CalendarView";
import QuickUpcomingTasksSidebar from "./QuickUpcomingTasksSidebar";
import MobileDayTimeline from "./MobileDayTimeline";

interface Task {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  durationMinutes: number;
  completedAt: string | null;
}

interface TaskSyncStatus {
  syncStatus: "synced" | "pending" | "conflict";
  conflictResolution: string | null;
  googleEventId: string;
}

interface DayPlannerContentProps {
  tasks: Task[];
  planDate: string;
  viewStartTime: string;
  viewEndTime: string;
  focusMode: boolean;
  taskSyncStatus: Record<string, TaskSyncStatus>;
  onAddTask: (startTime?: string) => void;
  onEditTask: (task: Task) => void;
}

export default function DayPlannerContent({
  tasks,
  planDate,
  viewStartTime,
  viewEndTime,
  focusMode,
  taskSyncStatus,
  onAddTask,
  onEditTask,
}: DayPlannerContentProps) {
  const calendarViewRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <MobileDayTimeline
        tasks={tasks}
        viewStartTime={viewStartTime}
        viewEndTime={viewEndTime}
        taskSyncStatus={taskSyncStatus}
        onAddTask={onAddTask}
        onEditTask={onEditTask}
      />

      <div className="hidden md:flex gap-6">
        {/* Calendar View - Main Content */}
        <div className="flex-1 min-w-0">
          <CalendarView
            ref={calendarViewRef}
            tasks={tasks}
            viewStartTime={viewStartTime}
            viewEndTime={viewEndTime}
            onAddTask={onAddTask}
            onEditTask={onEditTask}
            taskSyncStatus={taskSyncStatus}
          />
        </div>

        {/* Quick Upcoming Tasks Sidebar */}
        {!focusMode && (
          <QuickUpcomingTasksSidebar allTasks={tasks} currentDate={planDate} />
        )}
      </div>
    </>
  );
}
