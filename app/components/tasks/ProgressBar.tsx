export default function ProgressBar({
  progressPercentage,
  completedSteps,
  totalSteps,
  size = "default",
}: {
  progressPercentage: number;
  completedSteps: number;
  totalSteps: number;
  size?: "small" | "default";
}) {
  const heightClass = size === "small" ? "h-2" : "h-3";
  const textSizeClass = size === "small" ? "text-xs" : "text-sm";

  return (
    <div className={`w-full ${size === "default" ? "mt-2" : ""}`}>
      <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full ${heightClass}`}>
        <div
          style={{ width: `${progressPercentage}%` }}
          className={`bg-gray-600 dark:bg-gray-400 ${heightClass} rounded-full transition-all duration-150`}
        />
      </div>
      {size === "default" && (
        <p className={`text-gray-600 dark:text-gray-400 text-center mt-1.5 ${textSizeClass}`}>
          {completedSteps} / {totalSteps} Steps ({progressPercentage}%)
        </p>
      )}
      {size === "small" && totalSteps > 0 && (
        <p className={`text-gray-500 dark:text-gray-400 text-right mt-1 ${textSizeClass}`}>
          {progressPercentage}%
        </p>
      )}
    </div>
  );
}
