import { NavLink } from "react-router";

interface NavbarProps {
  isAuthenticated: boolean;
}

export default function Navbar({ isAuthenticated }: NavbarProps) {
  return (
    <div className="flex flex-row justify-between space-x-4">
      <div className="text-2xl">
        <NavLink to="/">Sanctuary</NavLink>
      </div>
      <div className="flex flex-row space-x-4">
        {!isAuthenticated ? (
          <>
            <NavLink
              to="/auth/login"
              className="hover:text-blue-600 transition-colors duration-200"
            >
              Login
            </NavLink>
            <NavLink
              to="/auth/register"
              className="hover:text-blue-600 transition-colors duration-200"
            >
              Register
            </NavLink>
          </>
        ) : (
          <>
            <NavLink
              to="/dashboard"
              className="hover:text-blue-600 transition-colors duration-200"
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/golf"
              className="hover:text-blue-600 transition-colors duration-200"
            >
              Golf
            </NavLink>
            <NavLink
              to="/auth/logout"
              className="hover:text-blue-600 transition-colors duration-200"
            >
              Logout
            </NavLink>
          </>
        )}
      </div>
    </div>
  );
}
