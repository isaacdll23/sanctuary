import { tasksTable } from "~/db/schema"
import { useFetcher } from "react-router"

interface TaskItemProps {
    task: typeof tasksTable.$inferSelect
}

export default function TaskItem({ task }: TaskItemProps) {
    let fetcher = useFetcher();
    return (
        <li
        key={task.id}
        className="flex items-center justify-between border-b-2 border-gray-800 p-4"
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
              <input
                type="hidden"
                name="completeTask"
                value={task.id}
              />
              <button
                type="submit"
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
              className="rounded bg-red-600 text-white px-3 py-1 text-xs hover:bg-red-700"
            >
              Delete
            </button>
          </fetcher.Form>
        </div>
      </li>
    )
};