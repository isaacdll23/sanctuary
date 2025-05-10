import { useState } from 'react';
import SidebarLink from './SidebarLink';
import {
  ArrowLeftOnRectangleIcon,
  CogIcon,
  HomeIcon,
  UserCircleIcon,
  CurrencyDollarIcon, // Example for Finance
  ClipboardDocumentListIcon, // Example for Tasks
  ArrowRightOnRectangleIcon // Example for Login
} from '@heroicons/react/24/outline'; // Using outline icons, you can choose solid if preferred

interface SidebarProps {
  isAuthenticated: boolean;
}

const navItemsUnauth = [
  { to: '/auth/login', label: 'Login', icon: ArrowRightOnRectangleIcon },
  { to: '/auth/register', label: 'Register', icon: UserCircleIcon }, // Example, choose a more appropriate icon
];

const navItemsAuth = [
  { to: '/dashboard', label: 'Dashboard', icon: HomeIcon },
  { to: '/finance', label: 'Finance', icon: CurrencyDollarIcon },
  { to: '/tasks', label: 'Tasks', icon: ClipboardDocumentListIcon },
  // Example for Profile and Settings - you'll need to add these routes if they exist
  // { to: '/profile', label: 'Profile', icon: UserCircleIcon },
  // { to: '/settings', label: 'Settings', icon: CogIcon },
  { to: '/auth/logout', label: 'Logout', icon: ArrowLeftOnRectangleIcon },
];

export default function Sidebar({ isAuthenticated }: SidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const navItems = isAuthenticated ? navItemsAuth : navItemsUnauth;

  return (
    <>
      {/* Hamburger Menu - Mobile */}
      <button
        onClick={toggleMobileMenu}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
        aria-controls="sidebar"
        aria-expanded={isMobileMenuOpen}
        aria-label="Open sidebar"
      >
        <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sidebar */}
      <aside
        id="sidebar"
        className={`fixed top-0 left-0 z-40 h-screen bg-gray-900 text-white transition-transform transform ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:w-64 w-64 md:sticky md:flex md:flex-col`}
      >
        <div className="flex justify-between items-center p-4 md:hidden">
          <span className="text-xl font-semibold">Menu</span>
          <button
            onClick={toggleMobileMenu}
            className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            aria-label="Close sidebar"
          >
            <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map((item) => (
            <SidebarLink key={item.to} to={item.to} label={item.label} icon={item.icon} onClick={isMobileMenuOpen ? toggleMobileMenu : undefined} />
          ))}
        </nav>
      </aside>
      {/* Overlay for mobile when sidebar is open */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black opacity-50 md:hidden"
          onClick={toggleMobileMenu}
          aria-hidden="true"
        ></div>
      )}
    </>
  );
}
