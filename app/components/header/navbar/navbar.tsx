import { useState } from "react";
import { NavLink } from "react-router";

interface NavbarProps {
  isAuthenticated: boolean;
}

export default function Navbar({ isAuthenticated }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  

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
        to="/tasks"
        className="block px-2 py-1 hover:text-blue-600 transition-colors duration-200"
      >
        Tasks
      </NavLink>
      <NavLink
        to="/auth/logout"
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
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            {!isAuthenticated ? menuItemsUnauth : menuItemsAuth}
          </div>
        </div>
      )}
    </nav>
  );
}