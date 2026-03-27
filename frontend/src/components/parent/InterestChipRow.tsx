"use client";

import {
  PARENT_INTEREST_OPTIONS,
  type ParentInterestId,
} from "@/lib/parentInterests";
import styles from "./InterestChipRow.module.css";

type Props = {
  selected: ParentInterestId[];
  onChange: (next: ParentInterestId[]) => void;
  disabled?: boolean;
};

export default function InterestChipRow({ selected, onChange, disabled }: Props) {
  const toggle = (id: ParentInterestId) => {
    if (disabled) return;
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      if (selected.length >= 6) return;
      onChange([...selected, id]);
    }
  };

  return (
    <div className={styles.wrap} role="group" aria-label="관심사 태그">
      {PARENT_INTEREST_OPTIONS.map((opt) => {
        const on = selected.includes(opt.id);
        return (
          <button
            key={opt.id}
            type="button"
            disabled={disabled}
            className={`${styles.chip} ${on ? styles.chipOn : ""}`}
            onClick={() => toggle(opt.id)}
            aria-pressed={on}
            aria-label={`${opt.hashtag} ${opt.label}`}
          >
            <span className={styles.hash}>{opt.hashtag}</span>
          </button>
        );
      })}
    </div>
  );
}
