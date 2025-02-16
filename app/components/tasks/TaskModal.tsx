import type { tasksTable, taskStepsTable } from "~/db/schema";
import ProgressBar from "~/components/tasks/ProgressBar";
import TaskStep from "./TaskStep";

export default function TaskModal({
  task,
  taskSteps,
  progressPercentage,
  progressColor,
  completedSteps,
  totalSteps,
  fetcher,
  onClose,
}: {
  task: typeof tasksTable.$inferSelect;
  taskSteps?: (typeof taskStepsTable.$inferSelect)[];
  progressPercentage: number;
  progressColor: string;
  completedSteps: number;
  totalSteps: number;
  fetcher: any;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/50 z-50 w-full">
      <div className="bg-gray-800 rounded-xl p-6 w-5/6 md:w-4/6 xl:w-3/6 relative">
        <h2 className="text-2xl font-bold mb-1">{task.title}</h2>
        <p className="text-sm text-gray-600 mb-2">
          Created: {task.createdAt.toLocaleDateString()}
        </p>
        {task.completedAt && (
          <p className="text-sm text-green-600">
            Completed: {new Date(task.completedAt).toLocaleDateString()}
          </p>
        )}
        {task.description && (
          <div className="flex flex-col mt-4">
            <h3 className="text-lg font-bold text-white mb-2">Description</h3>
            <p className="text-md text-white">{task.description}</p>
          </div>
        )}

        {totalSteps > 0 && (
          <div className="flex flex-col mt-4">
            <h3 className="text-lg font-bold text-white mb-2">Progress</h3>
            <ProgressBar
              progressPercentage={progressPercentage}
              progressColor={progressColor}
              completedSteps={completedSteps}
              totalSteps={totalSteps}
            />
          </div>
        )}

        {taskSteps && taskSteps.length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-bold text-white mb-2">Steps</h3>
            <ul className="space-y-2">
              {taskSteps.map((step) => (
                <TaskStep taskStep={step} fetcher={fetcher} />
              ))}
            </ul>
          </div>
        )}

        <fetcher.Form
          method="post"
          className="mt-4 mb-4 flex flex-col items-center gap-2"
        >
          <div className="flex flex-row justify-start items-center w-full">
            <h3 className="text-lg font-bold text-white mb-2">Add Step</h3>
          </div>
          <input type="hidden" name="taskId" value={task.id} />
          <input
            type="text"
            name="stepDescription"
            placeholder="New step..."
            className="w-full border-2 border-gray-500 rounded-xl p-2 text-sm bg-gray-600 text-white"
          />
          <button
            type="submit"
            className="w-full md:w-1/3 rounded-xl bg-blue-600 text-white px-3 p-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white hover:bg-blue-700 transition-colors duration-200"
          >
            Add Step
          </button>
        </fetcher.Form>

        <div className="flex justify-center items-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="w-full md:w-1/3 rounded-xl border-2 px-8 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 border-gray-800 bg-gray-700 text-white hover:bg-gray-900 focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
