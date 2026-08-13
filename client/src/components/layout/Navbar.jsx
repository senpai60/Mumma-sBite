import { History, ShoppingCart, User, CakeSlice, Plus } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { ThemeToggle } from "../ui/ThemeToggle";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useCartContext } from "../../context/CartContext";
import AddProductModal from "./AddProductModal";

const ICON_SIZE = 16;

const navLinksIconButtonData = [
  {
    Icon: History,
    link: "/orders",
    label: "Orders",
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

const NavIconButton = ({ to, Icon, label, isActive, badgeCount }) => {
  return (
    <Link
      to={to}
      aria-label={label}
      className={`relative inline-flex items-center justify-center rounded-lg border px-2.5 py-2
        transition-colors
        ${
          isActive
            ? "bg-primary-soft border-primary text-primary"
            : "bg-surface border-border text-text hover:border-primary-soft"
        }`}
    >
      <Icon size={ICON_SIZE} />
      {badgeCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[0.6rem] font-bold text-white shadow-xs">
          {badgeCount > 99 ? "99+" : badgeCount}
        </span>
      )}
    </Link>
  );
};

export default function Navbar() {
  const location = useLocation();
  const { user } = useAuth();
  const { cart } = useCartContext();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const cartItemCount = cart?.totalItems || 0;

  return (
    <>
      <nav className="flex items-center justify-between px-4 sm:px-6 md:px-12 py-4 bg-bg border-b border-border">
        {/* Left: logo / brand */}
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-accent-soft flex items-center justify-center text-accent text-sm font-bold">
            <CakeSlice size={ICON_SIZE} />
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
          {user && user.role === "admin" && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-white text-xs font-medium px-3 py-2 hover:opacity-90 transition-opacity cursor-pointer"
            >
              <Plus size={ICON_SIZE} />
              <span className="hidden sm:inline">Add Recipe</span>
            </button>
          )}

          <div className="nav-links flex gap-2 sm:gap-3">
            {navLinksIconButtonData.map(({ Icon, link, label }) => {
              const isActive =
                location.pathname === link ||
                location.pathname.startsWith(link + "/");
              const badgeCount = link === "/cart" ? cartItemCount : 0;

              return (
                <NavIconButton
                  key={link}
                  to={link}
                  Icon={Icon}
                  label={label}
                  isActive={isActive}
                  badgeCount={badgeCount}
                />
              );
            })}
          </div>
          <ThemeToggle />
        </div>
      </nav>

      <AddProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProductAdded={() => window.location.reload()}
      />
    </>
  );
}
