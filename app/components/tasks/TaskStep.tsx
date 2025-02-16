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
      className="flex items-center border-2 rounded-xl border-gray-500 p-2 hover:bg-gray-700 transition-colors duration-200"
    >
      <fetcher.Form method="post" className="flex items-center w-full">
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
    </li>
  );
}
