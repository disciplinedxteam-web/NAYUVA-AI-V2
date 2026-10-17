import { Button } from './button';
/** One rounded glass track with a sliding brand glider. */
export function GlassToggle({ options, value, onChange, label }: { options: { key: string; label: string; count?: number }[]; value: string; onChange: (k: string) => void; label?: string }) {
  const index = Math.max(0, options.findIndex((o) => o.key === value));
  return (
    <div className="glass-toggle" role="radiogroup" aria-label={label} style={{ ['--n' as string]: options.length, ['--i' as string]: index }}>
      {options.map((o) => (
        <Button variant="ghost" key={o.key} type="button" role="radio" aria-checked={o.key === value} onClick={() => onChange(o.key)}>
          <span>{o.label}</span>
          {o.count !== undefined && <span className="glass-toggle-count">{o.count}</span>}
        </Button>
      ))}
      <span className="glass-glider" aria-hidden="true" />
    </div>
  );
}
