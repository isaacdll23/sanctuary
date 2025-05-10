export default function ProgressBar({
    progressPercentage,
    completedSteps,
    totalSteps,
    size = "default", // Add size prop with a default value
  }: {
    progressPercentage: number;
    completedSteps: number;
    totalSteps: number;
    size?: 'small' | 'default'; // Define size options
  }) {

  let progressColor = "bg-red-500"; // Default to red
  if (progressPercentage >= 80) {
    progressColor = "bg-green-500";
  } else if (progressPercentage >= 50) {
    progressColor = "bg-yellow-500";
  } else if (progressPercentage > 0) {
    progressColor = "bg-blue-500"; // Changed from red to blue for low positive progress
  }

  const heightClass = size === 'small' ? 'h-2' : 'h-3';
  const textSizeClass = size === 'small' ? 'text-xs' : 'text-sm';

  return (
    <div className={`w-full ${size === 'default' ? 'mt-2' : ''}`}>
      <div className={`w-full bg-slate-600 rounded-full ${heightClass}`}>
        <div
          style={{ width: `${progressPercentage}%` }}
          className={`${progressColor} ${heightClass} rounded-full transition-all duration-500 ease-out`}
        />
      </div>
      {size === 'default' && (
        <p className={`text-slate-400 text-center mt-1.5 ${textSizeClass}`}>
          {completedSteps} / {totalSteps} Steps ({progressPercentage}%)
        </p>
      )}
      {size === 'small' && totalSteps > 0 && (
         <p className={`text-slate-500 text-right mt-1 ${textSizeClass}`}>
          {progressPercentage}%
        </p>
      )}
    </div>
  );
}