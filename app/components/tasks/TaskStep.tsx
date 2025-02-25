import type { FetcherWithComponents } from "react-router";
import type { taskStepsTable } from "~/db/schema";

interface TaskStepProps {
  taskStep: typeof taskStepsTable.$inferSelect;
  fetcher: FetcherWithComponents<any>;
}

export default function TaskStep({ taskStep, fetcher }: TaskStepProps) {
  return (
    <li
      key={taskStep.id}
      className="flex items-center border-2 rounded-xl border-gray-500 p-2"
    >
      <fetcher.Form method="post" className="flex flex-row items-center w-5/6">
        <input type="hidden" name="completeStep" value={taskStep.id} />
        <label className="flex items-center w-full cursor-pointer">
          <input
            type="checkbox"
            checked={taskStep.completedAt !== null}
            onChange={(e) => {
              const isChecked = e.target.checked;
              fetcher.submit(
                {
                  completeStep: taskStep.id.toString(),
                  isChecked: isChecked.toString(),
                },
                { method: "post" }
              );
            }}
            className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2 text-white">{taskStep.description}</span>
        </label>
      </fetcher.Form>
      <fetcher.Form
        method="post"
        className="flex flex-row items-center justify-center w-1/6"
      >
        <input type="hidden" name="deleteStep" value={taskStep.id} />
        <button
          type="submit"
          className="text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </fetcher.Form>
    </li>
  );
}
