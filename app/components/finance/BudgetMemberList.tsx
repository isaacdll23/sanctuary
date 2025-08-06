import { TrashIcon, UserCircleIcon } from "@heroicons/react/24/outline";

interface Member {
  id: string | number;
  name: string;
  email?: string;
  role: string;
  status: string;
}

interface BudgetMemberListProps {
  members: Member[];
  currentUserId: string | number;
  isOwner: boolean;
  onRemove?: (memberId: string | number) => void;
  onRoleChange?: (memberId: string | number, newRole: string) => void;
}

export default function BudgetMemberList({
  members,
  currentUserId,
  isOwner,
  onRemove,
  onRoleChange,
}: BudgetMemberListProps) {
  return (
    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
      {members.map((member) => (
        <li key={member.id} className="flex items-center py-3">
          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-3">
            <UserCircleIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-gray-900 dark:text-gray-100">
              {member.name || member.email}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
              {member.status === "pending" && (
                <span className="ml-2 text-yellow-500">(Pending)</span>
              )}
            </div>
          </div>
          {isOwner && member.id !== currentUserId && (
            <button
              className="ml-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
              aria-label="Remove member"
              onClick={() => onRemove && onRemove(member.id)}
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          )}
          {isOwner && member.id !== currentUserId && (
            <select
              className="ml-2 px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-700 text-xs"
              value={member.role}
              onChange={(e) =>
                onRoleChange && onRoleChange(member.id, e.target.value)
              }
            >
              <option value="owner">Owner</option>
              <option value="contributor">Contributor</option>
            </select>
          )}
        </li>
      ))}
    </ul>
  );
}
