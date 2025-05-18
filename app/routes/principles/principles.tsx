import { useState, useEffect, useMemo, useRef } from "react";
import { desc, sql } from "drizzle-orm";
import { useFetcher, useLoaderData, useRevalidator } from "react-router";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import ReactMarkdown from "react-markdown";
import {
  pageAccessLoader,
  pageAccessAction,
} from "~/modules/middleware/pageAccess";
import type { principlesTable } from "~/db/schema"; // Ensure this type is correctly imported
import { fuzzyMatch } from "~/utils/fuzzyMatch";

export function meta() {
  return [{ title: "Principles" }];
}

export const loader = pageAccessLoader("principles", async (user, request) => {
  const { db } = await import("~/db");
  const { principlesTable } = await import("~/db/schema");
  const url = new URL(request.url);
  const searchTerm = url.searchParams.get("q") || "";

  const principles = await db
    .select()
    .from(principlesTable)
    .where(
      sql`${principlesTable.userId} = ${user.id} AND (${
        principlesTable.title
      } ILIKE ${`%${searchTerm}%`} OR ${
        principlesTable.content
      } ILIKE ${`%${searchTerm}%`})`
    )
    .orderBy(desc(principlesTable.updatedAt));

  return { principles, searchTerm };
});

export const action = pageAccessAction("principles", async (user, request) => {
  const { handlePrincipleAction } = await import(
    "~/modules/services/PrincipleService"
  );
  const response = await handlePrincipleAction(request);
  // Assuming handlePrincipleAction returns a Response object or similar
  // And that it might contain information about the success or the created/updated principle
  return response;
});

export default function PrinciplesPage() {
  const { principles: initialPrinciples, searchTerm: initialSearchTerm } =
    useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const revalidator = useRevalidator();

  const [searchQuery, setSearchQuery] = useState(initialSearchTerm);
  const [selectedPrincipleId, setSelectedPrincipleId] = useState<number | null>(
    null
  );
  const [isEditing, setIsEditing] = useState(false);

  const principles = fetcher.data?.principles || initialPrinciples;

  // Filter principles client-side using fuzzyMatch
  const filteredPrinciples = useMemo(() => {
    if (!searchQuery) return principles;
    return principles.filter(
      (p: any) =>
        fuzzyMatch(p.title, searchQuery) || fuzzyMatch(p.content, searchQuery)
    );
  }, [principles, searchQuery]);

  // Ref to track the previous state of the fetcher to detect state transitions
  const prevFetcherStateRef = useRef(fetcher.state);

  useEffect(() => {
    const previousState = prevFetcherStateRef.current;

    // Check if a fetcher action (submission) has just completed
    if (
      fetcher.state === "idle" &&
      previousState === "submitting" &&
      fetcher.data
    ) {
      if (fetcher.data.success) {
        setIsEditing(false); // Exit edit mode on successful submission (create or update)

        if (fetcher.data.createdPrincipleId) {
          setSelectedPrincipleId(fetcher.data.createdPrincipleId);
        } else if (fetcher.data.deletedPrincipleId) {
          if (selectedPrincipleId === fetcher.data.deletedPrincipleId) {
            setSelectedPrincipleId(null);
            // setIsEditing(false) was already called above, so editor will be closed.
          }
        }
        // For updates, selectedPrincipleId remains the same, and setIsEditing(false) handles exiting edit mode.
        revalidator.revalidate();
      }
      // Errors (fetcher.data.error) are expected to be handled within the PrincipleEditor component.
    }

    // Update the ref to the current fetcher state for the next render cycle.
    prevFetcherStateRef.current = fetcher.state;
  }, [fetcher.state, fetcher.data, revalidator, selectedPrincipleId]); // isEditing is intentionally not a dependency here

  const selectedPrinciple = useMemo(() => {
    return principles.find((p: any) => p.id === selectedPrincipleId) || null;
  }, [principles, selectedPrincipleId]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchQuery(value);
    // Only trigger server-side search if query is not empty
    if (value) {
      fetcher.load(`/principles?q=${encodeURIComponent(value)}`);
    } else {
      // If search is cleared, reload all principles from the server
      fetcher.load(`/principles`);
    }
  };

  const handleSelectPrinciple = (
    principle: typeof principlesTable.$inferSelect
  ) => {
    setSelectedPrincipleId(principle.id);
    setIsEditing(false);
  };

  const handleCreateNew = () => {
    setSelectedPrincipleId(null); // Deselect any current principle
    setIsEditing(true); // Open editor for a new principle
  };

  const handleDelete = (principleId: number) => {
    if (window.confirm("Are you sure you want to delete this principle?")) {
      fetcher.submit(
        { intent: "deletePrinciple", principleId: principleId.toString() },
        { method: "post", action: "/principles" } // Ensure action points to the correct route
      );
    }
  };

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100">
      {/* Left Column: Principles List & Search */}
      <div className="w-1/3 border-r border-slate-700 p-4 flex flex-col">
        <div className="mb-4">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 text-slate-400 absolute top-1/2 left-3 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search principles..."
              className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 pl-10 focus:ring-purple-500 focus:border-purple-500"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        </div>
        <button
          onClick={handleCreateNew}
          className="mb-4 w-full flex items-center justify-center px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 text-white font-medium hover:from-purple-600 hover:to-pink-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Principle
        </button>
        <div className="flex-grow overflow-y-auto space-y-2 p-1">
          {filteredPrinciples.length > 0 ? (
            filteredPrinciples.map((p: any) => (
              <div
                key={p.id}
                onClick={() => handleSelectPrinciple(p)}
                className={`p-3 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors ${
                  selectedPrincipleId === p.id
                    ? "bg-slate-700 ring-2 ring-purple-500"
                    : "bg-slate-800"
                }`}
              >
                <h3 className="font-semibold truncate text-purple-400">
                  {p.title}
                </h3>
              </div>
            ))
          ) : (
            <p className="text-slate-400 text-center py-4">
              {searchQuery
                ? "No principles match your search."
                : "No principles yet. Create one!"}
            </p>
          )}
        </div>
      </div>

      {/* Right Column: Preview or Edit Principle */}
      <div className="w-2/3 p-6 overflow-y-auto">
        {isEditing ? (
          <PrincipleEditor
            key={selectedPrinciple?.id || "new"} // Ensures form resets when switching principles or creating new
            principle={selectedPrinciple}
            fetcher={fetcher}
            onCancel={() => setIsEditing(false)}
          />
        ) : selectedPrinciple ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                {selectedPrinciple.title}
              </h1>
              <div className="flex space-x-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 rounded-md bg-slate-700 hover:bg-slate-600 text-purple-400 transition-colors"
                  aria-label="Edit principle"
                >
                  <PencilSquareIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDelete(selectedPrinciple.id)}
                  className="p-2 rounded-md bg-slate-700 hover:bg-slate-600 text-red-500 transition-colors"
                  aria-label="Delete principle"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="prose prose-invert prose-sm md:prose-base max-w-none bg-slate-800 p-4 rounded-lg">
              {/* 
                Markdown Rendering Issue:
                If H1, H2, etc., are not styled correctly, ensure the Tailwind Typography plugin 
                (@tailwindcss/typography) is correctly installed and configured in your app.css file.
              */}
              <ReactMarkdown>{selectedPrinciple.content}</ReactMarkdown>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-center">
              <PencilSquareIcon className="h-16 w-16 text-slate-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-slate-400">
                Select a principle to view or edit
              </h2>
              <p className="text-slate-500">
                Or, create a new one using the button on the left.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// In-place editor component
function PrincipleEditor({
  principle,
  fetcher,
  onCancel,
}: {
  principle?: typeof principlesTable.$inferSelect | null;
  fetcher: any; // Type this properly based on useFetcher
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(principle?.title || "");
  const [content, setContent] = useState(principle?.content || "");
  const isNew = !principle;

  // Update local state if the selected principle changes (e.g., user clicks "Edit" on a different principle)
  useEffect(() => {
    setTitle(principle?.title || "");
    setContent(principle?.content || "");
  }, [principle]);

  return (
    <fetcher.Form method="post" action="/principles" className="space-y-6">
      <input
        type="hidden"
        name="intent"
        value={isNew ? "createPrinciple" : "updatePrinciple"}
      />
      {principle?.id && (
        <input type="hidden" name="principleId" value={principle.id} />
      )}

      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-slate-300 mb-1"
        >
          Title
        </label>
        <input
          type="text"
          name="title"
          id="title"
          required
          className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 focus:ring-purple-500 focus:border-purple-500"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Principle Title"
        />
      </div>

      <div>
        <label
          htmlFor="content"
          className="block text-sm font-medium text-slate-300 mb-1"
        >
          Content (Markdown supported)
        </label>
        <textarea
          name="content"
          id="content"
          required
          rows={12}
          className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 focus:ring-purple-500 focus:border-purple-500"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your principle content here..."
        />
      </div>

      {fetcher.data?.error && (
        <p className="text-red-500 text-sm">{fetcher.data.error}</p>
      )}

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={fetcher.state === "submitting"}
          className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 text-white font-medium hover:from-purple-600 hover:to-pink-700 transition-colors disabled:opacity-50"
        >
          {fetcher.state === "submitting"
            ? isNew
              ? "Creating..."
              : "Saving..."
            : isNew
            ? "Create Principle"
            : "Save Changes"}
        </button>
      </div>
    </fetcher.Form>
  );
}
