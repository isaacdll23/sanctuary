import AddTaskModal from "~/components/day-planner/AddTaskModal";
import EditTaskModal from "~/components/day-planner/EditTaskModal";
import ConflictResolutionModal from "~/components/day-planner/ConflictResolutionModal";

type Task = {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  durationMinutes: number;
  completedAt: string | null;
};

interface TaskModalsContainerProps {
  showAddModal: boolean;
  showEditModal: boolean;
  showConflictModal: boolean;
  plan: {
    id: string;
    tasks: Task[];
  } | null;
  defaultStartTime: string | undefined;
  taskToEdit: Task | null;
  conflictData: {
    mappingId: string;
    taskId: string;
    localVersion: {
      title: string;
      description: string | null;
      startTime: string;
      durationMinutes: number;
    };
    googleVersion: {
      title: string;
      description?: string;
      startTime: string;
      durationMinutes: number;
    };
  } | null;
  onAddModalClose: () => void;
  onEditModalClose: () => void;
  onConflictModalClose: () => void;
}

export default function TaskModalsContainer({
  showAddModal,
  showEditModal,
  showConflictModal,
  plan,
  defaultStartTime,
  taskToEdit,
  conflictData,
  onAddModalClose,
  onEditModalClose,
  onConflictModalClose,
}: TaskModalsContainerProps) {
  return (
    <>
      {showAddModal && plan && (
        <AddTaskModal
          planId={plan.id}
          existingTasks={plan.tasks}
          onClose={onAddModalClose}
          defaultStartTime={defaultStartTime}
        />
      )}

      {showEditModal && taskToEdit && (
        <EditTaskModal
          task={taskToEdit}
          existingTasks={plan?.tasks || []}
          onClose={onEditModalClose}
        />
      )}

      {conflictData && (
        <ConflictResolutionModal
          isOpen={showConflictModal}
          mappingId={conflictData.mappingId}
          localVersion={conflictData.localVersion}
          googleVersion={conflictData.googleVersion}
          onClose={onConflictModalClose}
        />
      )}
    </>
  );
}
