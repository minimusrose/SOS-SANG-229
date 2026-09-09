import { BLOOD_GROUPS } from "../data/demo.js";

export default function BloodGroupSelect({
  id,
  value,
  onChange,
  required = false,
}) {
  return (
    <select
      id={id}
      className="field-input"
      value={value}
      onChange={onChange}
      required={required}
    >
      <option value="">Choisir un groupe</option>
      {BLOOD_GROUPS.map((group) => (
        <option key={group} value={group}>
          {group}
        </option>
      ))}
    </select>
  );
}
