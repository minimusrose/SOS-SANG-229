export default function PageHeader({ kicker, title, highlight, children }) {
  return (
    <header className="space-y-3">
      {kicker ? (
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-strong">
          {kicker}
        </p>
      ) : null}
      <h1 className="text-3xl font-extrabold leading-[1.14] tracking-tight text-secondary sm:text-4xl">
        {title}
        {highlight ? (
          <>
            {" "}
            <span className="text-primary">{highlight}</span>
          </>
        ) : null}
      </h1>
      {children ? (
        <div className="max-w-2xl text-base leading-7 text-muted">{children}</div>
      ) : null}
    </header>
  );
}
