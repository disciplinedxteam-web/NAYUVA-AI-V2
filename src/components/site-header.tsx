import { useEffect, useState, type ReactNode } from "react";
import { MusicToggle } from "@/components/music-toggle";

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
        {[["Tutorial for Judges","videos"], ["Products","platform"], ["Team","team"]].map(([label,id]) => <a key={id} href={`#${id}`}>{label}</a>)}
      </nav>
      <MusicToggle />
    </header>
  </div>;
}