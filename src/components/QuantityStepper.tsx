"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";

type Props = {
  itemName: string;
  quantity: number;
  unit: string;
  onChange: (quantity: number) => void;
};

export function QuantityStepper({ itemName, quantity, unit, onChange }: Props) {
  const [draft, setDraft] = useState(String(quantity));

  const commit = () => {
    if (!draft.trim()) {
      setDraft(String(quantity));
      return;
    }
    const nextQuantity = Number(draft);
    if (!Number.isFinite(nextQuantity) || nextQuantity < 0) {
      setDraft(String(quantity));
      return;
    }
    onChange(nextQuantity);
    if (nextQuantity > 0) setDraft(String(nextQuantity));
  };

  return (
    <div className="stepper" aria-label={`${itemName} 수량`}>
      <button type="button" onClick={() => onChange(quantity - 1)} aria-label={`${itemName} 수량 줄이기`}>
        <Minus size={18} />
      </button>
      <label>
        <span className="sr-only">{itemName} 수량 직접 입력</span>
        <input
          type="number"
          inputMode="decimal"
          step="any"
          min="0"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
          }}
        />
        <small>{unit}</small>
      </label>
      <button type="button" onClick={() => onChange(quantity + 1)} aria-label={`${itemName} 수량 늘리기`}>
        <Plus size={18} />
      </button>
    </div>
  );
}
