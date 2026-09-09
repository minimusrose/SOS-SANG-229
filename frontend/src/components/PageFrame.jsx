export default function PageFrame({ children, wide = false }) {
  return (
    <div
      className={`mx-auto w-full px-4 py-10 sm:px-6 sm:py-14 lg:px-8 ${
        wide ? "max-w-5xl" : "max-w-2xl"
      }`}
    >
      {children}
    </div>
  );
}
