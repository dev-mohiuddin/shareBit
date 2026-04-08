import { Link } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { landingNavLinks } from "@/content/landing/copy";

export const LandingHeader = ({ isDark, onToggleTheme }) => {
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link to="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <span className="h-2.5 w-2.5 rounded-full bg-primary" />
          ShareBit
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {landingNavLinks.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={onToggleTheme} aria-label="Toggle theme">
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" asChild className="hidden sm:inline-flex">
            <Link to="/login">Login</Link>
          </Button>
          <Button asChild>
            <Link to="/register">Open Account</Link>
          </Button>
        </div>
      </div>
    </header>
  );
};
