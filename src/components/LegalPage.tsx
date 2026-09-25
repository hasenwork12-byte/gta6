export default function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <article className="section max-w-3xl pt-14">
      <p className="label">Legal</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
      <p className="mt-2 font-mono text-xs text-muted">Last updated {updated}</p>
      <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-muted [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-medium [&_h2]:text-fg [&_strong]:text-fg">
        {children}
      </div>
    </article>
  );
}
