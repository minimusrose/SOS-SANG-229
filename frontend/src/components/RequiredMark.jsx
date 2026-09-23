/**
 * "(requis)" hint next to a field label. Disappears as soon as `valid`
 * becomes true, reappears if the field becomes invalid again — purely
 * presentational, never the actual required/validation logic (the input
 * keeps its own `required` attribute regardless of this).
 */
export default function RequiredMark({ valid, children = "(requis)" }) {
  if (valid) return null;
  return <span className="font-normal text-primary-strong">{children}</span>;
}
