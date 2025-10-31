import type { FetcherWithComponents } from "react-router";
import type { TaskStep as TaskStepType } from "~/types/task.types";
import { TrashIcon } from "@heroicons/react/24/outline";

interface TaskStepProps {
  taskStep: TaskStepType;
  fetcher: FetcherWithComponents<any>;
  isCompactView?: boolean;
}

export default function TaskStep({
  taskStep,
  fetcher,
  isCompactView,
}: TaskStepProps) {
  const isCompleted = taskStep.completedAt !== null;

  return (
    <li
      className={`
        flex items-center justify-between rounded-lg 
        transition-colors duration-200 
        ${
          isCompleted
            ? "bg-gray-100 dark:bg-gray-700/50 opacity-70"
            : "bg-gray-100 dark:bg-gray-700/80 hover:bg-gray-200 dark:hover:bg-gray-600/80"
        }
        ${isCompactView ? "p-2" : "p-3"}
      `}
    >
      <fetcher.Form method="post" className="flex items-center flex-grow mr-2">
        <input
          type="hidden"
          name="completeStep"
          value={taskStep.id.toString()}
        />
        <label className="flex items-center cursor-pointer flex-grow">
          <input
            type="checkbox"
            checked={isCompleted}
            onChange={(e) => {
              fetcher.submit(
                {
                  completeStep: taskStep.id.toString(),
                  isChecked: e.target.checked.toString(),
                },
                { method: "post" }
              );
            }}
            className={`
              rounded-md border-2 transition-colors
              ${
                isCompleted
                  ? "bg-green-500 border-green-600 focus:ring-green-500/50"
                  : "bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-500 hover:border-purple-500 focus:ring-purple-500/50"
              }
              text-green-500 focus:ring-offset-0 focus:ring-2 cursor-pointer
              ${isCompactView ? "h-4 w-4" : "h-5 w-5"}
            `}
          />
          <span
            className={`
              ml-3 
              ${
                isCompleted
                  ? "text-gray-500 dark:text-gray-300 line-through"
                  : "text-gray-900 dark:text-gray-100"
              }
              ${isCompactView ? "text-xs" : "text-sm"}
            `}
          >
            {taskStep.description}
          </span>
        </label>
      </fetcher.Form>
      <fetcher.Form method="post" className="flex-shrink-0">
        <input type="hidden" name="deleteStep" value={taskStep.id.toString()} />
        <button
          type="submit"
          onClick={(e) => {
            if (!confirm("Are you sure you want to delete this step?")) {
              e.preventDefault();
            }
          }}
          className={`text-gray-400 dark:text-gray-300 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors ${
            isCompactView ? "p-1" : "p-1.5"
          }`}
          aria-label="Delete step"
        >
          <TrashIcon
            className={`${isCompactView ? "h-3.5 w-3.5" : "h-4 w-4"}`}
          />
        </button>
      </fetcher.Form>
    </li>
  );
}
