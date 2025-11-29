import { History, ShoppingCart, User,CakeSlice } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { ThemeToggle } from "../ui/ThemeToggle";

const ICON_SIZE = 16;

const navLinksIconButtonData = [
  {
    Icon: History,
    link: "/history",
    label: "Order history",
  },
  {
    Icon: ShoppingCart,
    link: "/cart",
    label: "Cart",
  },
  {
    Icon: User,
    link: "/profile",
    label: "Profile",
  },
];

const NavIconButton = ({ to, Icon, label, isActive }) => {
  return (
    <Link
      to={to}
      aria-label={label}
      className={`inline-flex items-center justify-center rounded-lg border px-2.5 py-2
        transition-colors
        ${
          isActive
            ? "bg-primary-soft border-primary text-primary"
            : "bg-surface border-border text-text hover:border-primary-soft"
        }`}
    >
      <Icon size={ICON_SIZE} />
    </Link>
  );
};

export default function Navbar() {
  const location = useLocation();

  return (
    <nav className="flex items-center justify-between px-4 sm:px-6 md:px-12 py-4 bg-bg border-b border-border">
      {/* Left: logo / brand */}
      <Link to="/" className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-xl bg-accent-soft flex items-center justify-center text-accent text-sm font-bold">
          <CakeSlice size={ICON_SIZE}/>
        </div>
        <div className="flex flex-col">
          <span className="font-display text-base sm:text-lg text-text leading-none">
            Mumma&apos;s Bite
          </span>
          <span className="font-sans text-[0.65rem] text-text-light">
            Handmade chocolates & bakes
          </span>
        </div>
      </Link>

      {/* Right: icons + theme toggle */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="nav-links flex gap-2 sm:gap-3">
          {navLinksIconButtonData.map(({ Icon, link, label }) => {
            const isActive =
              location.pathname === link ||
              location.pathname.startsWith(link + "/");

            return (
              <NavIconButton
                key={link}
                to={link}
                Icon={Icon}
                label={label}
                isActive={isActive}
              />
            );
          })}
        </div>
        <ThemeToggle />
      </div>
    </nav>
  );
}
