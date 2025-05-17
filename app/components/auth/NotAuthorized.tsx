import React from "react";

/**
 * NotAuthorized component for displaying when access is denied
 * Should be used as a UI component when a fuller error page is needed
 */
export default function NotAuthorized() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4">
      <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-2xl shadow-lg p-8 max-w-lg w-full text-center">
        <h1 className="text-3xl font-bold text-red-500 mb-4">Access Denied</h1>
        <p className="text-slate-300 mb-6">
          You don't have permission to access this page. Please contact an administrator
          if you believe this is an error.
        </p>
        <a 
          href="/dashboard" 
          className="inline-block px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          Return to Dashboard
        </a>
      </div>
    </div>
  );
}
