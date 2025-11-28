import { History, ShoppingCart, User } from "lucide-react";
import { ThemeToggle } from "../ui/ThemeToggle";

const navLinksIconButtonData = [
  {
    icon: <History />,
    link: "/history",
  },
  {
    icon: <ShoppingCart />,
    link: "/cart",
  },
  {
    icon: <User />,
    link: "/profile",
  },
];

const NavIconButton = ({ onClick, children }) => {
  return (
    <button
      onClick={onClick}
      className="p-2 rounded-lg border border-border bg-surface text-text"
    >
      {children}
    </button>
  );
};

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between px-4 md:px-30 py-4 bg-bg border-b border-border">
      <div className="font-semibold text-text text-lg">Giftify</div>

      <div className="flex items-center gap-15">
        <div className="nav-links flex gap-2">
          {navLinksIconButtonData.map((linkData) => {
            return (
              <NavIconButton key={linkData.link}>{linkData.icon}</NavIconButton>
            );
          })}
        </div>
        <ThemeToggle />
      </div>
    </nav>
  );
}
