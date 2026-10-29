import { Lightbulb, ShieldCheck } from 'lucide-react';

/** Light, eye-catching instruction callout used for judge/demo testing guidance. */
export function DemoGuide({ title, children }: { title: string; children: string }) {
  return <div className="demo-guide" role="note"><span className="demo-guide-icon"><Lightbulb size={16} /></span><div><strong>{title}</strong><p>{children}</p></div></div>;
}

/** Consent reassurance line shown beside consent checkboxes. */
export function SecureNote({ children = 'Your information is encrypted in transit and at rest, and is only shared with your authorised care team.' }: { children?: string }) {
  return <p className="secure-note"><ShieldCheck size={14} />{children}</p>;
}
