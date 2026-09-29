import { HONEYPOT_FIELD } from "@/lib/validation";

/** Campo trampa para bots: invisible para personas y lectores de pantalla. */
export default function Honeypot({
  value,
  onChange,
}: {
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label>
        No llenes este campo
        <input
          type="text"
          name={HONEYPOT_FIELD}
          tabIndex={-1}
          autoComplete="off"
          {...(onChange ? { value: value ?? "", onChange: (e) => onChange(e.target.value) } : {})}
        />
      </label>
    </div>
  );
}
