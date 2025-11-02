import type { FetcherWithComponents } from "react-router";
import type { TaskStep as TaskStepType } from "~/types/task.types";
import { TrashIcon } from "@heroicons/react/24/outline";

interface TaskStepProps {
  taskStep: TaskStepType;
  fetcher: FetcherWithComponents<any>;
}

export default function TaskStep({
  taskStep,
  fetcher,
}: TaskStepProps) {
  const isCompleted = taskStep.completedAt !== null;

  return (
    <li className="flex items-center justify-between gap-3 p-3 rounded-lg bg-gray-100 dark:bg-gray-700 transition-colors duration-150 group hover:bg-gray-200 dark:hover:bg-gray-600">
      <fetcher.Form method="post" className="flex items-center flex-grow">
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
            className="w-5 h-5 rounded-md border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-600 checked:bg-gray-900 dark:checked:bg-gray-100 checked:border-gray-900 dark:checked:border-gray-100 cursor-pointer transition-colors duration-150 focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600"
          />
          <span
            className={`ml-3 text-sm transition-all duration-150 ${
              isCompleted
                ? "text-gray-500 dark:text-gray-400 line-through"
                : "text-gray-900 dark:text-gray-100"
            }`}
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
          className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-lg transition-colors duration-150 opacity-0 group-hover:opacity-100"
          title="Delete step"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </fetcher.Form>
    </li>
  );
}
