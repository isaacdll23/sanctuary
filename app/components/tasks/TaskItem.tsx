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
          <p className="text-sm text-gray-400 hidden md:block">
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
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsModalOpen(false);
              }}
              className="w-1/4 mt-4 rounded-xl border-2 px-8 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 border-gray-800 bg-gray-700 text-white hover:bg-gray-900 focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}