import { ThemeToggle } from "../ui/ThemeToggle";

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-bg border-b border-border">
      <div className="font-semibold text-text text-lg">Giftify</div>
      <ThemeToggle />
    </nav>
  );
}
