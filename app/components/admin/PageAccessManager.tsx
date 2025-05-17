import React, { useState } from 'react';
import { useFetcher } from 'react-router';

// Available pages in the app
const APP_PAGES = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'finance', label: 'Finance' },
  { id: 'principles', label: 'Principles' },
  { id: 'golf', label: 'Golf' },
  { id: 'utilities/commands', label: 'Utilities Commands' }
];

type User = {
  id: number;
  username: string;
  email: string;
  passwordHash: string;
  role: string;
  allowedPages?: any;
  createdAt: Date;
};

type PageAccessManagerProps = {
  users: User[];
};

export default function PageAccessManager({ users }: PageAccessManagerProps) {
  const [expandedUser, setExpandedUser] = useState<number | null>(null);
  const fetcher = useFetcher();

  // Toggle user expansion
  const toggleUserExpansion = (userId: number) => {
    setExpandedUser(expandedUser === userId ? null : userId);
  };

  // Handle checkbox change
  const handlePageAccessChange = (userId: number, pageId: string, isChecked: boolean) => {
    fetcher.submit(
      {
        userId: userId.toString(),
        pageId,
        action: isChecked ? 'grant' : 'revoke',
        intent: 'updatePageAccess'
      },
      { method: 'post' }
    );
  };

  return (
    <section className="bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-2xl shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Page Access Management</h2>
      
      <div className="space-y-4">
        {users.map((user) => {
          const isExpanded = expandedUser === user.id;
          const allowedPages = user.allowedPages ? 
            (typeof user.allowedPages === 'string' ? 
              JSON.parse(user.allowedPages) : user.allowedPages) : [];
          
          return (
            <div key={user.id} className="border border-slate-700 rounded-xl overflow-hidden">
              {/* User header - clickable to expand */}
              <div 
                className={`flex justify-between items-center p-4 cursor-pointer hover:bg-slate-700/30 ${
                  isExpanded ? 'bg-slate-700/50' : ''
                }`}
                onClick={() => toggleUserExpansion(user.id)}
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-lg">{user.username}</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {user.role}
                  </span>
                </div>
                <div className="text-slate-400">
                  {isExpanded ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>
              
              {/* Expanded content with page access controls */}
              {isExpanded && (
                <div className="p-4 pt-0 bg-slate-700/20">
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {APP_PAGES.map((page) => {
                      // Admin users always have access to all pages
                      const isAdminUser = user.role === 'admin';
                      const hasAccess = isAdminUser || allowedPages.includes(page.id);
                      
                      return (
                        <div key={page.id} className="flex items-center">
                          <label className="flex items-center gap-3 cursor-pointer group">
                            <input 
                              type="checkbox"
                              checked={hasAccess}
                              disabled={isAdminUser || fetcher.state !== 'idle'}
                              onChange={(e) => handlePageAccessChange(user.id, page.id, e.target.checked)}
                              className={`
                                form-checkbox h-5 w-5 rounded-md focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-blue-500
                                ${isAdminUser ? 'opacity-60' : 'opacity-100'}
                                ${hasAccess ? 'text-blue-500 border-blue-500' : 'text-slate-400 border-slate-500'}
                              `}
                            />
                            <span className={`text-base ${hasAccess ? 'font-medium' : 'text-slate-400'}`}>
                              {page.label}
                            </span>
                            {isAdminUser && (
                              <span className="text-xs text-slate-500 ml-auto italic opacity-0 group-hover:opacity-100 transition-opacity">
                                (Always allowed)
                              </span>
                            )}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                  
                  {fetcher.state !== 'idle' && (
                    <div className="mt-4 text-sm text-blue-400">
                      Updating permissions...
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
