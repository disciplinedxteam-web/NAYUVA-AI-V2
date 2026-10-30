/** NΛYUVΛ ΛI wordmark: each A is the real capital Lambda glyph so every letter shares one cap height and baseline. */
export function BrandWordmark({ className = '' }: { className?: string }) {
  return <span className={`brand-wordmark ${className}`} aria-label="Nayuva AI">
    <span aria-hidden="true">NΛYUVΛ</span><span className="brand-gap" aria-hidden="true" /><span aria-hidden="true">ΛI</span>
  </span>;
}
