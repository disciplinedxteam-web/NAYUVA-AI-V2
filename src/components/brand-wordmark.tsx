/** NΛYUVΛ ΛI wordmark: each A is a drawn Λ sized to Michroma's exact cap height and stroke, so every letter shares one size and baseline. */
export function BrandWordmark({ className = '' }: { className?: string }) {
  const L = () => <svg className="brand-lambda" viewBox="0 0 86 74.5" aria-hidden="true" focusable="false"><path d="M0 74.5 39.2 0h7.6L86 74.5H78.1L43 7.9 7.9 74.5Z" fill="currentColor" /></svg>;
  return <span className={`brand-wordmark ${className}`} aria-label="Nayuva AI">
    <span aria-hidden="true">N</span><L /><span aria-hidden="true">YUV</span><L /><span className="brand-gap" aria-hidden="true" /><L /><span aria-hidden="true">I</span>
  </span>;
}
