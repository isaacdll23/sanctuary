import { NavLink, type NavLinkProps } from 'react-router';

interface SidebarLinkProps extends NavLinkProps {
  label: string;
  onClick?: () => void;
  icon?: React.ElementType; // Add icon prop
}

export default function SidebarLink({ to, label, onClick, icon: Icon, ...rest }: SidebarLinkProps) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors duration-150
        ${
          isActive
            ? 'bg-gray-700 text-white'
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
        }`
      }
      {...rest}
    >
      {Icon && <Icon className="h-6 w-6 mr-3" aria-hidden="true" />} {/* Render icon */}
      {label}
    </NavLink>
  );
}
