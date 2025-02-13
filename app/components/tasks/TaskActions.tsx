export default function TaskActions({ task, fetcher }: { task: any; fetcher: any }) {
  return (
    <div className="flex flex-col md:flex-row gap-2 w-1/3 justify-end items-center">
      {!task.completedAt && (
        <fetcher.Form method="post" className="w-full md:w-1/3 flex justify-center text-center">
          <input type="hidden" name="completeTask" value={task.id} />
          <button
            type="submit"
            onClick={(e) => e.stopPropagation()}
            className="w-full rounded bg-green-600 px-3 py-1 text-xs hover:bg-green-700"
          >
            Complete
          </button>
        </fetcher.Form>
      )}
      <fetcher.Form method="post" className="w-full md:w-1/3 flex justify-center text-center">
        <input type="hidden" name="deleteTask" value={task.id} />
        <button
          type="submit"
          onClick={(e) => e.stopPropagation()}
          className="w-full rounded bg-red-600 px-3 py-1 text-xs hover:bg-red-700"
        >
          Delete
        </button>
      </fetcher.Form>
    </div>
  );
}