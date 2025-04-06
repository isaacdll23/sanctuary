import { useState } from "react";
import { NavLink } from "react-router";

interface NavbarProps {
  isAuthenticated: boolean;
}

export default function Navbar({ isAuthenticated }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isUtilitiesDropdownOpen, setUtilitiesDropdownOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleProfileDropdown = () => {
    if (isUtilitiesDropdownOpen) {
      setUtilitiesDropdownOpen(false);
    }

    setProfileDropdownOpen(!isProfileDropdownOpen);
  };

  const toggleUtilitiesDropdown = () => {
    if (isProfileDropdownOpen) {
      setProfileDropdownOpen(false);
    }

    setUtilitiesDropdownOpen(!isUtilitiesDropdownOpen);
  };

  const DefaultAvatar = ({ size = 8 }: { size?: number }) => (
    <div
      className={`w-${size} h-${size} rounded-full bg-gray-200 flex items-center justify-center`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={`w-${size === 8 ? 6 : 6} h-${
          size === 8 ? 6 : 6
        } text-gray-500`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        {/* Head */}
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 12a5 5 0 100-10 5 5 0 000 10z"
        />
        {/* Shoulders */}
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 21v-2a4 4 0 014-4h8a4 4 0 014 4v2"
        />
      </svg>
    </div>
  );

  // Desktop menu items (no onClick needed)
  const menuItemsUnauth = (
    <>
      <NavLink
        to="/auth/login"
        className="block px-2 py-1 hover:text-blue-600 transition-colors duration-200"
      >
        Login
      </NavLink>
      <NavLink
        to="/auth/register"
        className="block px-2 py-1 hover:text-blue-600 transition-colors duration-200"
      >
        Register
      </NavLink>
    </>
  );

  const menuItemsAuth = (
    <>
      <NavLink
        to="/dashboard"
        className="block px-2 py-1 hover:text-blue-600 transition-colors duration-200"
      >
        Dashboard
      </NavLink>
      {/* <NavLink
        to="/golf"
        className="block px-2 py-1 hover:text-blue-600 transition-colors duration-200"
      >
        Golf
      </NavLink> */}
      <NavLink
        to="/finance"
        className="block px-2 py-1 hover:text-blue-600 transition-colors duration-200"
      >
        Finance
      </NavLink>
      <NavLink
        to="/tasks"
        className="block px-2 py-1 hover:text-blue-600 transition-colors duration-200"
      >
        Tasks
      </NavLink>

      <div className="relative inline-block">
        <button
          onClick={() => toggleUtilitiesDropdown()}
          className="block px-2 py-1 hover:text-blue-600 transition-colors duration-200 focus:outline-none"
        >
          Utilities
          <svg
            className="w-4 h-4 inline ml-1"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
        {isUtilitiesDropdownOpen && (
          <div className="absolute right-0 mt-2 w-40 bg-gray-700 border rounded-lg shadow-lg z-10">
            <NavLink
              to="/utilities/commands"
              onClick={() => setUtilitiesDropdownOpen(false)}
              className="block px-4 py-2 hover:bg-gray-800 rounded-2xl"
            >
              Commands
            </NavLink>
          </div>
        )}
      </div>

      <div className="relative inline-block">
        <button
          onClick={toggleProfileDropdown}
          className="flex items-center space-x-1 focus:outline-none"
        >
          <DefaultAvatar size={8} />
          {/* Down Arrow */}
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
        {isProfileDropdownOpen && (
          <div className="absolute right-0 mt-2 w-32 bg-gray-700 border rounded-lg shadow-lg z-10">
            <NavLink
              to="/profile"
              onClick={() => setProfileDropdownOpen(false)}
              className="block px-4 py-2 hover:bg-gray-800 rounded-t-lg"
            >
              Profile
            </NavLink>
            <NavLink
              to="/auth/logout"
              onClick={() => setProfileDropdownOpen(false)}
              className="block px-4 py-2 hover:bg-gray-800 rounded-b-lg"
            >
              Logout
            </NavLink>
          </div>
        )}
      </div>
    </>
  );

  // Mobile menu items with onClick to close the menu immediately
  const mobileMenuItemsUnauth = (
    <>
      <NavLink
        to="/auth/login"
        onClick={() => setIsMobileMenuOpen(false)}
        className="block px-2 py-1 hover:text-blue-600 transition-colors duration-200"
      >
        Login
      </NavLink>
      <NavLink
        to="/auth/register"
        onClick={() => setIsMobileMenuOpen(false)}
        className="block px-2 py-1 hover:text-blue-600 transition-colors duration-200"
      >
        Register
      </NavLink>
    </>
  );

  const mobileMenuItemsAuth = (
    <>
      <NavLink
        to="/dashboard"
        onClick={() => setIsMobileMenuOpen(false)}
        className="block px-2 py-1 hover:text-blue-600 transition-colors duration-200"
      >
        Dashboard
      </NavLink>
      <NavLink
        to="/finance"
        onClick={() => setIsMobileMenuOpen(false)}
        className="block px-2 py-1 hover:text-blue-600 transition-colors duration-200"
      >
        Finance
      </NavLink>
      <NavLink
        to="/tasks"
        onClick={() => setIsMobileMenuOpen(false)}
        className="block px-2 py-1 hover:text-blue-600 transition-colors duration-200"
      >
        Tasks
      </NavLink>
      {/* Updated Mobile Utilities dropdown */}
      <div className="relative">
        <button
          onClick={() => setUtilitiesDropdownOpen(!isUtilitiesDropdownOpen)}
          className="w-full text-left block px-2 py-1 hover:text-blue-600 transition-colors duration-200 focus:outline-none"
        >
          Utilities
          <svg
            className="w-4 h-4 inline ml-1"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
        {isUtilitiesDropdownOpen && (
          <div className="mt-1 pl-4">
            <NavLink
              to="/utilities/commands"
              onClick={() => {
                setIsMobileMenuOpen(false);
                setUtilitiesDropdownOpen(false);
              }}
              className="block px-2 py-1 hover:text-blue-600 transition-colors duration-200"
            >
              Commands
            </NavLink>
          </div>
        )}
      </div>
      <NavLink
        to="/auth/logout"
        onClick={() => setIsMobileMenuOpen(false)}
        className="block px-2 py-1 hover:text-blue-600 transition-colors duration-200"
      >
        Logout
      </NavLink>
    </>
  );

  return (
    <nav className="w-full">
      <div className="flex items-center justify-end p-4">
        {/* Desktop Menu */}
        <div className="hidden md:flex md:space-x-4">
          {!isAuthenticated ? menuItemsUnauth : menuItemsAuth}
        </div>
        {/* Mobile Hamburger Icon */}
        <div className="md:hidden">
          <button onClick={toggleMobileMenu} className="focus:outline-none">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              ></path>
            </svg>
          </button>
        </div>
      </div>
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden px-4 pb-4">
          <div className="flex flex-col items-center space-y-2">
            {!isAuthenticated ? mobileMenuItemsUnauth : mobileMenuItemsAuth}
          </div>
        </div>
      )}
    </nav>
  );
}
