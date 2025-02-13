import { useState } from "react";
import { tasksTable, taskStepsTable } from "~/db/schema";
import { useFetcher } from "react-router";
import TaskActions from "~/components/tasks/TaskActions";
import TaskModal from "~/components/tasks/TaskModal";
import ProgressBar from "./ProgressBar";

interface TaskItemProps {
  task: typeof tasksTable.$inferSelect;
  taskSteps?: typeof taskStepsTable.$inferSelect[];
}

export default function TaskItem({ task, taskSteps }: TaskItemProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fetcher = useFetcher();

  // Compute progress if task steps exist
  const totalSteps = taskSteps ? taskSteps.length : 0;
  const completedSteps = taskSteps
    ? taskSteps.filter((step) => step.completedAt !== null).length
    : 0;
  const progressPercentage =
    totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  // Determine progress color
  let progressColor = "bg-red-500";
  if (progressPercentage >= 80) {
    progressColor = "bg-green-500";
  } else if (progressPercentage >= 50) {
    progressColor = "bg-yellow-500";
  }

  return (
    <>
      <li
        onClick={() => setIsModalOpen(true)}
        className="cursor-pointer first:rounded-t-xl last:rounded-b-xl text-white p-4 hover:bg-gray-700 transition-colors duration-200"
      >
        <div className="flex flex-row justify-baseline items-center mb-2">
          {/* Task Information */}
          <div className="w-2/3 md:w-1/3">
            <p className="text-sm md:text-xl">{task.title}</p>
            <div className="hidden md:flex flex-col">
              <p className="text-sm text-gray-400">
                Created: {task.createdAt.toLocaleDateString()}
              </p>
              {task.completedAt && (
                <p className="text-sm text-green-500">
                  Completed: {new Date(task.completedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          {totalSteps > 0 && (
            <div className="w-1/3 hidden md:flex flex-col items-center"> 
              <ProgressBar
                progressPercentage={progressPercentage}
                progressColor={progressColor}
                completedSteps={completedSteps}
                totalSteps={totalSteps}
              />
            </div>
          )}

          <TaskActions task={task} fetcher={fetcher} />
        </div>
      </li>

      {isModalOpen && (
        <TaskModal
          task={task}
          taskSteps={taskSteps}
          progressPercentage={progressPercentage}
          progressColor={progressColor}
          completedSteps={completedSteps}
          totalSteps={totalSteps}
          fetcher={fetcher}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}