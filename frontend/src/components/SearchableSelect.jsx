import { useEffect, useId, useMemo, useRef, useState } from "react";

/**
 * Accessible combobox (WAI-ARIA combobox-with-listbox pattern): a text input
 * that filters a fixed option list as you type, plus full keyboard support.
 * Selection is restricted to `options` — free text that matches nothing
 * simply filters to an empty list, it never becomes the applied value.
 *
 * `options` accepts either a flat string array (value === label, e.g. a
 * city name) or an array of `{ value, label }` objects when the stored
 * value differs from what's displayed/searched (e.g. a hospital's id vs.
 * its name). Both shapes can be mixed freely across consumers.
 */
export default function SearchableSelect({
  id,
  label,
  labelExtra,
  value,
  onChange,
  options,
  allLabel = "Toutes",
  placeholder,
  required = false,
  showAllOption = true,
}) {
  const generatedId = useId();
  const fieldId = id || generatedId;
  const listId = `${fieldId}-listbox`;

  const normalizedOptions = useMemo(
    () =>
      options.map((option) =>
        typeof option === "string" ? { value: option, label: option } : option,
      ),
    [options],
  );
  const selected = useMemo(
    () => normalizedOptions.find((option) => option.value === value) || null,
    [normalizedOptions, value],
  );

  const [query, setQuery] = useState(selected?.label || "");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    setQuery(selected?.label || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("fr");
    if (!q || q === selected?.label?.toLocaleLowerCase("fr")) return normalizedOptions;
    return normalizedOptions.filter((option) =>
      option.label.toLocaleLowerCase("fr").includes(q),
    );
  }, [query, normalizedOptions, selected]);

  useEffect(() => {
    function handlePointerDown(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
        setActiveIndex(-1);
        setQuery(selected?.label || "");
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  function selectOption(option) {
    onChange(option.value);
    setQuery(option.label);
    setOpen(false);
    setActiveIndex(-1);
  }

  function clearSelection() {
    onChange("");
    setQuery("");
    setOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  }

  function handleKeyDown(event) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => Math.min(current + 1, filtered.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
    } else if (event.key === "Enter") {
      if (open && activeIndex >= 0 && filtered[activeIndex] !== undefined) {
        event.preventDefault();
        selectOption(filtered[activeIndex]);
      }
    } else if (event.key === "Escape") {
      if (open) {
        event.preventDefault();
        setOpen(false);
        setActiveIndex(-1);
        setQuery(selected?.label || "");
      }
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <label className="field-label mb-1.5" htmlFor={fieldId}>
        {label}
        {labelExtra ? <> {labelExtra}</> : null}
      </label>
      <div className="relative">
        <input
          id={fieldId}
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            open && activeIndex >= 0 ? `${listId}-opt-${activeIndex}` : undefined
          }
          className="field-input pr-9"
          value={query}
          placeholder={placeholder || allLabel}
          autoComplete="off"
          required={required}
          onChange={(event) => {
            const next = event.target.value;
            setQuery(next);
            setOpen(true);
            setActiveIndex(-1);
            if (next === "") onChange("");
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
        />
        {value ? (
          <button
            type="button"
            onClick={clearSelection}
            aria-label={`Effacer ${label}`}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted hover:text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        ) : null}
      </div>
      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-accent/20 bg-white py-1 shadow-lg"
        >
          {showAllOption ? (
            <li
              role="option"
              aria-selected={!value}
              className={`cursor-pointer px-3 py-2 text-sm ${
                !value ? "bg-primary/10 font-semibold text-primary-strong" : "text-secondary hover:bg-light"
              }`}
              onMouseDown={(event) => {
                event.preventDefault();
                clearSelection();
              }}
            >
              {allLabel}
            </li>
          ) : null}
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted">Aucun résultat</li>
          ) : (
            filtered.map((option, index) => (
              <li
                key={option.value}
                id={`${listId}-opt-${index}`}
                role="option"
                aria-selected={value === option.value}
                className={`cursor-pointer px-3 py-2 text-sm ${
                  index === activeIndex
                    ? "bg-primary/10 text-primary-strong"
                    : value === option.value
                      ? "font-semibold text-primary-strong"
                      : "text-secondary hover:bg-light"
                }`}
                onMouseDown={(event) => {
                  event.preventDefault();
                  selectOption(option);
                }}
              >
                {option.label}
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
