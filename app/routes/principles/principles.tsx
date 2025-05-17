import { useState, useEffect } from "react";
import { eq, desc } from "drizzle-orm";
import { useFetcher, useLoaderData } from "react-router";
import { PlusIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import PrincipleItem from "~/components/principles/PrincipleItem";
import PrincipleModal from "~/components/principles/PrincipleModal";
import { pageAccessLoader, pageAccessAction } from "~/modules/middleware/pageAccess";

export function meta() {
  return [{ title: "Principles" }];
}

export const loader = pageAccessLoader("principles", async (user, request) => {
  // Server-only imports (React Router v7 will automatically strip these out in the client bundle)
  const { db } = await import("~/db");
  const { principlesTable } = await import("~/db/schema");

  const principles = await db
    .select()
    .from(principlesTable)
    .where(eq(principlesTable.userId, user.id))
    .orderBy(desc(principlesTable.updatedAt));

  return { principles };
});

export const action = pageAccessAction("principles", async (user, request) => {
  // Server-only imports
  const { handlePrincipleAction } = await import("~/modules/services/PrincipleService");
  return handlePrincipleAction(request);
});

export default function Principles() {
  const loaderData = useLoaderData<{ principles: any[] }>();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPrinciple, setSelectedPrinciple] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewPrinciple, setIsNewPrinciple] = useState(false);
  const fetcher = useFetcher();
  const filteredPrinciples = loaderData.principles.filter(
    (principle: any) => 
      principle.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      principle.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    // Close modal when action is successful
    if (
      fetcher.state === "idle" &&
      fetcher.data &&
      (fetcher.data as any).success === true &&
      isModalOpen
    ) {
      setIsModalOpen(false);
      setSelectedPrinciple(null);
      setIsNewPrinciple(false);
      fetcher.data = null; // Reset fetcher data
    }
  }, [fetcher.state, fetcher.data, isModalOpen]);

  const handleCreatePrinciple = () => {
    setSelectedPrinciple(null);
    setIsNewPrinciple(true);
    setIsModalOpen(true);
  };

  const handleEditPrinciple = (principle: any) => {
    setSelectedPrinciple(principle);
    setIsNewPrinciple(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPrinciple(null);
    setIsNewPrinciple(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <header className="mb-8 md:mb-12 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-center sm:text-left">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                My Principles
              </span>
            </h1>
            <p className="mt-2 text-lg text-slate-400 text-center sm:text-left">
              Document and reflect on your guiding principles.
            </p>
          </div>

          <div>
            <button
              onClick={handleCreatePrinciple}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 text-white font-medium hover:from-purple-600 hover:to-pink-700 transition-colors flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              New Principle
            </button>
          </div>
        </header>

        {/* Search */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full p-3 pl-10 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:ring-2 focus:ring-purple-500"
            placeholder="Search principles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Principles List */}
        {filteredPrinciples.length > 0 ? (
          <div className="space-y-4">
            {filteredPrinciples.map((principle: any) => (
              <PrincipleItem
                key={principle.id}
                principle={principle}
                onEdit={handleEditPrinciple}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            {searchQuery ? (
              <p className="text-slate-400">No principles match your search.</p>
            ) : (
              <div className="space-y-4">
                <p className="text-slate-400">You haven't created any principles yet.</p>
                <button
                  onClick={handleCreatePrinciple}
                  className="px-4 py-2 rounded-lg border border-purple-500 text-purple-400 hover:bg-purple-500/10 transition-colors"
                >
                  Create your first principle
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Principle Modal */}
      {isModalOpen && (
        <PrincipleModal
          principle={selectedPrinciple ?? undefined}
          isNew={isNewPrinciple}
          fetcher={fetcher}
          onClose={closeModal}
        />
      )}
    </div>
  );
}