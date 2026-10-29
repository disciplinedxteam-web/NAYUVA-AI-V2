export function WorkspaceHeading({ title, description }: { title: string; description: string }) {
  return <div className="workspace-heading"><span className="workspace-heading-mark" aria-hidden="true" /><div><h1>{title}</h1><p>{description}</p></div></div>;
}
