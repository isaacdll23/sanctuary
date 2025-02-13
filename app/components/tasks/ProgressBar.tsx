export default function ProgressBar({
    progressPercentage,
    completedSteps,
    totalSteps,
    progressColor,
  }: {
    progressPercentage: number;
    completedSteps: number;
    totalSteps: number;
    progressColor: string;
  }) {
    return (
      <div className="mt-4">
        <div className="w-full bg-gray-600 rounded-full h-4">
          <div
            style={{ width: `${progressPercentage}%` }}
            className={`${progressColor} h-4 rounded-full`}
          />
        </div>
        <p className="text-sm text-white text-center mt-1">
          {completedSteps} / {totalSteps} Steps Completed ({progressPercentage}%)
        </p>
      </div>
    );
  }