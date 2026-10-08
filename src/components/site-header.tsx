import { useEffect, useState, type ReactNode } from "react";
import { Languages, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function SiteHeader({ logo }: { logo: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    let previous = window.scrollY;
    const update = () => {
      const current = window.scrollY;
      setScrolled(current > 36);
      if (Math.abs(current - previous) > 4) {
        setHidden(current > 100 && current > previous);
        previous = current;
      }
      if (current <= 100) { setHidden(false); previous = current; }
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  return <div className="header-space">
    <header className="site-header" data-scrolled={scrolled} data-hidden={hidden} inert={hidden}>
      {logo}
      <nav aria-label="Main navigation" className="header-links">
        {["Solution", "Products", "Impact", "Team"].map(link => <a key={link} href={`#${link.toLowerCase()}`}>{link}</a>)}
      </nav>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Choose language" title="Choose language"><Languages /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Language</DropdownMenuLabel>
          <DropdownMenuItem><Check /> English</DropdownMenuItem>
          <DropdownMenuItem disabled>हिन्दी · Coming soon</DropdownMenuItem>
          <DropdownMenuItem disabled>ಕನ್ನಡ · Coming soon</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  </div>;
}