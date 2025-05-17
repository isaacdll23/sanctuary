import { useState } from "react";
import type { principlesTable } from "~/db/schema";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";

export default function PrincipleItem({
  principle,
  onEdit,
}: {
  principle: typeof principlesTable.$inferSelect;
  onEdit: (principle: typeof principlesTable.$inferSelect) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Format dates
  const formattedCreatedAt = format(new Date(principle.createdAt), "MMM d, yyyy");
  const formattedUpdatedAt = format(new Date(principle.updatedAt), "MMM d, yyyy");

  // Preview of content (first 150 chars)
  const contentPreview = principle.content.length > 150 
    ? `${principle.content.substring(0, 150)}...` 
    : principle.content;

  return (
    <div 
      className="bg-slate-800 border border-slate-700 rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden"
    >
      <div 
        className="p-4 cursor-pointer flex justify-between items-start"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex-1">
          <h3 className="text-lg font-medium text-purple-400 mb-1">
            {principle.title}
          </h3>
          
          <div className="text-xs text-slate-400 mb-2 flex gap-3">
            <span>Created: {formattedCreatedAt}</span>
            <span>Updated: {formattedUpdatedAt}</span>
          </div>
          
          {!isExpanded && (
            <div className="text-slate-300 text-sm line-clamp-2">              <ReactMarkdown components={{
                
                p: ({children}) => <span>{children}</span>
              }}>
                {contentPreview}
              </ReactMarkdown>
            </div>
          )}
        </div>
        
        <button className="ml-2 p-1 text-slate-400 hover:text-purple-400">
          {isExpanded ? (
            <ChevronUpIcon className="h-5 w-5" />
          ) : (
            <ChevronDownIcon className="h-5 w-5" />
          )}
        </button>
      </div>
      
      {isExpanded && (
        <div className="px-4 pb-4">
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown>{principle.content}</ReactMarkdown>
          </div>
          
          <div className="mt-4 flex justify-end">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(principle);
              }}
              className="px-3 py-1 rounded-md bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 text-sm font-medium transition-colors"
            >
              Edit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
