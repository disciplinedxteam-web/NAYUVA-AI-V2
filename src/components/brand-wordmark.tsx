/** NΛYUVΛ ΛI wordmark: each A is drawn as an SVG Λ sized to the font's cap height, so every letter matches in size and baseline at any font size. */
const L = () => <svg className="brand-lambda" viewBox="0 0 100 100" aria-hidden="true" preserveAspectRatio="none"><path d="M4 100 L50 2 L96 100" fill="none" stroke="currentColor" strokeWidth="11" strokeLinejoin="miter" vectorEffect="non-scaling-stroke" /></svg>;
export function BrandWordmark({ className = '' }: { className?: string }) {
  return <span className={`brand-wordmark ${className}`} aria-label="Nayuva AI">
    <span aria-hidden="true">N</span><L /><span aria-hidden="true">YUV</span><L /><span className="brand-gap" aria-hidden="true" /><L /><span aria-hidden="true">I</span>
  </span>;
}
