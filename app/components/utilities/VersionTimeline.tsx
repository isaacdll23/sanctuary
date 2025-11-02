import { VersionTimelineItem } from "./VersionTimelineItem";

interface VersionTimelineProps {
  versions: any[];
  currentVersion: number | null;
  onSelectVersion: (version: any) => void;
}

/**
 * VersionTimeline - Vertical scrollable timeline of command versions
 * Allows viewing and selecting historical versions
 */
export function VersionTimeline({
  versions,
  currentVersion,
  onSelectVersion,
}: VersionTimelineProps) {
  return (
    <div className="border-l-2 border-gray-300 dark:border-gray-600 pl-4 space-y-1 max-h-60 overflow-y-auto pr-2">
      {versions.map((version) => (
        <VersionTimelineItem
          key={version.id}
          version={version}
          isActive={currentVersion === version.version}
          onSelect={() => onSelectVersion(version)}
        />
      ))}
    </div>
  );
}
