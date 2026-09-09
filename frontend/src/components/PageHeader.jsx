export default function PageHeader({ kicker, title, children }) {
  return (
    <header className="space-y-2">
      {kicker ? (
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">
          {kicker}
        </p>
      ) : null}
      <h1 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
        {title}
      </h1>
      {children ? (
        <div className="max-w-prose text-sm leading-6 text-stone-600 sm:text-base">
          {children}
        </div>
      ) : null}
    </header>
  );
}
