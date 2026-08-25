import { NavLink } from "react-router";

const financePages = [
  { to: "/finance/expenses", label: "Expenses" },
  { to: "/finance/income", label: "Income" },
  { to: "/finance/budgets/shared", label: "Shared Budgets" },
];

export default function FinanceSubnav() {
  return (
    <nav
      aria-label="Finance sections"
      className="mb-6 -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0"
    >
      <div className="inline-flex min-w-max rounded-lg border border-gray-700 bg-gray-900/70 p-1">
        {financePages.map((page) => (
          <NavLink
            key={page.to}
            to={page.to}
            className={({ isActive }) =>
              [
                "rounded-md px-3 py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400",
                isActive
                  ? "bg-gray-700 text-gray-100 shadow-sm"
                  : "text-gray-400 hover:bg-gray-800 hover:text-gray-100",
              ].join(" ")
            }
          >
            {page.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
