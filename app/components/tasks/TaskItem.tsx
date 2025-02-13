import { useState } from "react";
import { tasksTable, taskStepsTable } from "~/db/schema";
import { useFetcher } from "react-router";

interface TaskItemProps {
  task: typeof tasksTable.$inferSelect;
  taskSteps?: typeof taskStepsTable.$inferSelect[];
}

export default function TaskItem({ task, taskSteps }: TaskItemProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  let fetcher = useFetcher();

  // Compute progress if steps exist
  const totalSteps = taskSteps ? taskSteps.length : 0;
  const completedSteps = taskSteps
    ? taskSteps.filter((step) => step.completedAt !== null).length
    : 0;
  const progressPercentage =
    totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  // Determine color based on progress
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

          <div className="md:flex flex-col w-1/3 justify-center items-center hidden">
            {/* Optional Progress Bar (middle section) */}
            {totalSteps > 0 && (
              <>
                <div className="w-full bg-gray-600 rounded-full h-4">
                  <div
                    style={{ width: `${progressPercentage}%` }}
                    className={`${progressColor} h-4 rounded-full`}
                  />
                </div>
                <p className="text-sm text-center mt-1">
                  {completedSteps} / {totalSteps} Steps Completed (
                  {progressPercentage}%)
                </p>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 w-1/3 justify-end items-center">
            {!task.completedAt && (
              <fetcher.Form method="post">
                <input type="hidden" name="completeTask" value={task.id} />
                <button
                  type="submit"
                  onClick={(e) => e.stopPropagation()}
                  className="rounded bg-green-600 px-3 py-1 text-xs hover:bg-green-700"
                >
                  Complete
                </button>
              </fetcher.Form>
            )}
            <fetcher.Form method="post">
              <input type="hidden" name="deleteTask" value={task.id} />
              <button
                type="submit"
                onClick={(e) => e.stopPropagation()}
                className="rounded bg-red-600 px-3 py-1 text-xs hover:bg-red-700"
              >
                Delete
              </button>
            </fetcher.Form>
          </div>
        </div>
      </li>

      {isModalOpen && (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/50 z-50 w-full">
          <div className="bg-gray-800 rounded-xl p-6 w-5/6 md:w-1/3 relative">
            <h2 className="text-2xl font-bold mb-1">{task.title}</h2>
            <p className="text-sm text-gray-600">
              Created: {task.createdAt.toLocaleDateString()}
            </p>
            {task.completedAt && (
              <p className="text-sm text-green-600">
                Completed: {new Date(task.completedAt).toLocaleDateString()}
              </p>
            )}
            {task.description && (
              <p className="text-md text-white mt-2">{task.description}</p>
            )}

            {/* Optional progress bar if steps exist */}
            {totalSteps > 0 && (
              <div className="mt-4">
                <div className="w-full bg-gray-600 rounded-full h-4">
                  <div
                    style={{ width: `${progressPercentage}%` }}
                    className={`${progressColor} h-4 rounded-full`}
                  />
                </div>
                <p className="text-sm text-white text-center mt-1">
                  {completedSteps} / {totalSteps} Steps Completed ({progressPercentage}%)
                </p>
              </div>
            )}

            {/* Render task steps if available */}
            {taskSteps && taskSteps.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-bold text-white mb-2">Steps</h3>
                <ul className="space-y-2">
                  {taskSteps.map((step) => (
                    <li key={step.id} className="flex items-center">
                      <fetcher.Form method="post" className="flex items-center">
                        <input type="hidden" name="completeStep" value={step.id} />
                        <input
                          type="checkbox"
                          checked={step.completedAt !== null}
                          onChange={(e) => {
                            const isChecked = e.target.checked;
                            fetcher.submit(
                              {
                                completeStep: step.id.toString(),
                                isChecked: isChecked.toString(),
                              },
                              { method: "post" }
                            );
                          }}
                          className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-white">
                          {step.description}
                        </span>
                      </fetcher.Form>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <fetcher.Form
              method="post"
              className="mt-4 flex items-center gap-2"
            >
              <input type="hidden" name="taskId" value={task.id} />
              <input
                type="text"
                name="stepDescription"
                placeholder="New step.." 
                className="w-5/6 border-2 border-gray-500 rounded-xl p-2 text-sm bg-gray-600 text-white"
              />
              <button
                type="submit"
                className="rounded-xl bg-blue-600 text-white px-3 py-1 text-xs hover:bg-blue-700"
              >
                Add Step
              </button>
            </fetcher.Form>
            <div className="flex justify-center items-center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsModalOpen(false);
                }}
                className="mt-4 rounded-xl border-2 px-8 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 border-gray-800 bg-gray-700 text-white hover:bg-gray-900 focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}