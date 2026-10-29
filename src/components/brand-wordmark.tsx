/** NΛYUVΛ ΛI wordmark: every A is drawn as a crossbar-less Λ (an inverted V). */
export function BrandWordmark({ className = '' }: { className?: string }) {
  const L = () => <span className="brand-lambda" aria-hidden="true">V</span>;
  return <span className={`brand-wordmark ${className}`} aria-label="Nayuva AI">
    <span aria-hidden="true">N</span><L /><span aria-hidden="true">YUV</span><L /><span className="brand-gap" aria-hidden="true" /><L /><span aria-hidden="true">I</span>
  </span>;
}
