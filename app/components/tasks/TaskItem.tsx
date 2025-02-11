import { useState } from "react";
import { tasksTable } from "~/db/schema";
import { useFetcher } from "react-router";

interface TaskItemProps {
  task: typeof tasksTable.$inferSelect;
}

export default function TaskItem({ task }: TaskItemProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  let fetcher = useFetcher();

  return (
    <>
      <li
        onClick={() => setIsModalOpen(true)}
        className="cursor-pointer flex items-center justify-between p-4 first:rounded-t-xl last:rounded-b-xl hover:bg-gray-700 transition-colors duration-200"
      >
        <div>
          <p className="font-semibold">{task.title}</p>
          <p className="text-sm text-gray-400">
            Created: {task.createdAt.toLocaleDateString()}
          </p>
          {task.completedAt && (
            <p className="text-sm text-green-500">
              Completed:{" "}
              {new Date(task.completedAt).toLocaleDateString()}
            </p>
          )}
        </div>
        <div className="flex gap-2">
        {!task.completedAt && (
            <fetcher.Form method="post">
              <input type="hidden" name="completeTask" value={task.id} />
              <button
                type="submit"
                onClick={(e) => e.stopPropagation()}
                className="rounded bg-green-600 text-white px-3 py-1 text-xs hover:bg-green-700"
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
              className="rounded bg-red-600 text-white px-3 py-1 text-xs hover:bg-red-700"
            >
              Delete
            </button>
          </fetcher.Form>
        </div>
      </li>

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-gray-900 p-6 rounded shadow-lg w5/6 md:w-80">
            <h2 className="text-xl font-bold mb-2">{task.title}</h2>
            <p className="text-sm text-gray-600">
              Created: {task.createdAt.toLocaleDateString()}
            </p>
            {task.completedAt && (
              <p className="text-sm text-green-600">
                Completed: {new Date(task.completedAt).toLocaleDateString()}
              </p>
            )}
            {task.description && (
              <p className="text-sm text-gray-600 mt-2">{task.description}</p>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsModalOpen(false);
              }}
              className="mt-4 rounded bg-gray-700 text-white px-3 py-1 text-xs hover:bg-gray-800"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}