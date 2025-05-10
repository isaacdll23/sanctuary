import type { FetcherWithComponents } from "react-router";
import type { taskStepsTable } from "~/db/schema";
import { TrashIcon } from "@heroicons/react/24/outline"; // For delete button

interface TaskStepProps {
  taskStep: typeof taskStepsTable.$inferSelect;
  fetcher: FetcherWithComponents<any>;
}

export default function TaskStep({ taskStep, fetcher }: TaskStepProps) {
  const isCompleted = taskStep.completedAt !== null;

  return (
    <li
      className={`
        flex items-center justify-between p-3 rounded-lg 
        transition-colors duration-200 
        ${
          isCompleted
            ? "bg-slate-700/50 opacity-70"
            : "bg-slate-700/80 hover:bg-slate-600/80"
        }
      `}
    >
      <fetcher.Form method="post" className="flex items-center flex-grow mr-2">
        {/* Hidden inputs for the server to identify the action and step */}
        {/* The backend TaskService.ts expects 'completeStep' and 'isChecked' for step completion,
             or just 'completeStep' with a null 'isChecked' (or 'isChecked' being 'false') for incompleting.
             Let's adjust to send 'completeStep' as the primary identifier and 'isChecked' for the state.
        */}
        <input type="hidden" name="completeStep" value={taskStep.id.toString()} />
        {/* 'isChecked' will be dynamically set in the fetcher.submit call */}

        {/* 
          The actual submission is triggered by onChange on the checkbox,
          but we can keep a visually hidden submit button for accessibility 
          or if we wanted a manual submit option.
          For now, direct onChange submission is fine.
        */}

        <label className="flex items-center cursor-pointer flex-grow">
          <input
            type="checkbox"
            checked={isCompleted}
            onChange={(e) => {
              // Submit the form when the checkbox state changes
              fetcher.submit(
                {
                  completeStep: taskStep.id.toString(), // Use 'completeStep' as the field name
                  isChecked: e.target.checked.toString(), // Send 'true' or 'false' as a string
                },
                { method: "post" }
              );
            }}
            className={`
              h-5 w-5 rounded-md border-2 transition-colors
              ${
                isCompleted
                  ? "bg-green-500 border-green-600 focus:ring-green-500/50"
                  : "bg-slate-600 border-slate-500 hover:border-purple-500 focus:ring-purple-500/50"
              }
              text-green-500 focus:ring-offset-0 focus:ring-2 cursor-pointer
            `}
          />
          <span
            className={`
              ml-3 text-sm 
              ${isCompleted ? "text-slate-400 line-through" : "text-slate-200"}
            `}
          >
            {taskStep.description}
          </span>
        </label>
      </fetcher.Form>

      <fetcher.Form method="post" className="flex-shrink-0">
        {/* TaskService.ts expects 'deleteStep' as the field name containing the stepId for deletion */}
        <input type="hidden" name="deleteStep" value={taskStep.id.toString()} />
        <button
          type="submit"
          onClick={(e) => {
            if (!confirm("Are you sure you want to delete this step?")) {
              e.preventDefault();
            }
          }}
          className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
          aria-label="Delete step"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </fetcher.Form>
    </li>
  );
}
