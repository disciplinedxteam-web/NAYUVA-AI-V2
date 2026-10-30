/** NΛYUVΛ ΛI wordmark: each A is Michroma's own V flipped, shifted back onto the cap line so every letter shares one size and baseline. */
export function BrandWordmark({ className = '' }: { className?: string }) {
  const L = () => <span className="brand-lambda" aria-hidden="true">V</span>;
  return <span className={`brand-wordmark ${className}`} aria-label="Nayuva AI">
    <span aria-hidden="true">N</span><L /><span aria-hidden="true">YUV</span><L /><span className="brand-gap" aria-hidden="true" /><L /><span aria-hidden="true">I</span>
  </span>;
}
