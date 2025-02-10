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
            <NavLink to="/auth/login">Login</NavLink>
            <NavLink to="/auth/register">Register</NavLink>
          </>
        ) : (
          <>
            <NavLink to="/dashboard">Dashboard</NavLink>
            <NavLink to="/golf">Golf</NavLink>
            <NavLink to="/auth/logout">Logout</NavLink>
          </>
        )}
      </div>
    </div>
  );
}
