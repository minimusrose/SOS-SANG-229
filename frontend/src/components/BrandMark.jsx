export default function BrandMark({ className = "h-9 w-9" }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-primary text-white ${className}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" className="h-[55%] w-[55%]" fill="currentColor">
        <path d="M12 3.2c.4.6 6.2 8.2 6.2 12a6.2 6.2 0 1 1-12.4 0c0-3.8 5.8-11.4 6.2-12Z" />
      </svg>
    </span>
  );
}
