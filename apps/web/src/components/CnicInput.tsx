import { Input } from "antd";
import { useMemo, useState } from "react";

function onlyDigits(s: string) {
  return s.replace(/\D/g, "");
}

function formatCnic(digitsRaw: string) {
  const digits = onlyDigits(digitsRaw).slice(0, 13);
  const p1 = digits.slice(0, 5);
  const p2 = digits.slice(5, 12); // 7 digits
  const p3 = digits.slice(12, 13); // 1 digit

  // Build progressively so the user sees dashes appear automatically.
  if (!digits.length) return "";
  if (digits.length <= 5) return p1;
  if (digits.length <= 12) return `${p1}-${p2}`;
  return `${p1}-${p2}-${p3}`;
}

type CnicInputProps = {
  value?: string;
  onChange?: (next: string) => void;
  placeholder?: string;
};

export default function CnicInput({ value, onChange, placeholder }: CnicInputProps) {
  const formatted = useMemo(() => (value ? formatCnic(value) : ""), [value]);
  const [draft, setDraft] = useState(formatted);

  // Keep local draft in sync when form sets a value.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  if (formatted !== draft) setDraft(formatted);

  return (
    <Input
      value={draft}
      placeholder={placeholder ?? "11111-1111111-1"}
      inputMode="numeric"
      maxLength={15}
      onChange={(e) => {
        const next = formatCnic(e.target.value);
        setDraft(next);
        onChange?.(next);
      }}
    />
  );
}

