import type { AnchorHTMLAttributes, CSSProperties } from "react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type GlassmorphismCtaProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  label?: string;
  avatarSrc?: string;
  avatarAlt?: string;
  spread?: string;
  shimmerColor?: string;
  speed?: string;
};

/** Dark glass capsule with a rotating conic shimmer border, logo badge, label and arrow. */
export default function GlassmorphismCta({
  label = "Watch Tutorial",
  avatarSrc,
  avatarAlt = "",
  spread = "90deg",
  shimmerColor = "rgba(255,255,255,0.6)",
  speed = "4s",
  className,
  href = "#",
  onClick,
  ...props
}: GlassmorphismCtaProps) {
  return (
    <a
      href={href}
      onClick={(event) => {
        if (href === "#") event.preventDefault();
        onClick?.(event);
      }}
      className={cn("glass-cta group", className)}
      style={{ "--spread": spread, "--shimmer-color": shimmerColor, "--speed": speed } as CSSProperties}
      {...props}
    >
      <span className="glass-cta-spin" aria-hidden="true"><span /></span>
      <span className="glass-cta-cut" aria-hidden="true" />
      <span className="glass-cta-body">
        <span className="glass-cta-beam" aria-hidden="true" />
        <span className="glass-cta-fill" aria-hidden="true" />
        {avatarSrc && <img src={avatarSrc} alt={avatarAlt} className="glass-cta-avatar" />}
        <span className="glass-cta-label">{label}</span>
        <span className="glass-cta-icon" aria-hidden="true"><ArrowUpRight strokeWidth={1.75} /></span>
      </span>
    </a>
  );
}
