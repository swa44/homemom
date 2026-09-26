"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Minus, Plus, Trash2, X } from "lucide-react";
import { LocationSelector } from "@/components/LocationSelector";
import {
  FREEZERS,
  SECTIONS,
  UNITS,
  type FreezerId,
  type FreezerItem,
  type FreezerSection,
} from "@/lib/types";

type ItemDraft = Omit<FreezerItem, "id" | "createdAt" | "updatedAt">;
type SavedLocation = Pick<ItemDraft, "section" | "level">;

type Props = {
  item?: FreezerItem;
  defaultFreezer: FreezerId;
  defaultSection?: FreezerSection;
  onClose: () => void;
  onSave: (draft: ItemDraft) => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
};

function createDraft(item: FreezerItem | undefined, freezer: FreezerId, section?: FreezerSection): ItemDraft {
  const targetFreezer = item?.freezer ?? freezer;
  return {
    name: item?.name ?? "",
    quantity: item?.quantity ?? 1,
    unit: item?.unit ?? "개",
    freezer: targetFreezer,
    section: item?.section ?? section ?? SECTIONS[targetFreezer][0].id,
    level: item?.level ?? 1,
    expiresOn: item?.expiresOn ?? "",
    memo: item?.memo ?? "",
  };
}

function createLocationMemory(item: FreezerItem | undefined, freezer: FreezerId, section?: FreezerSection) {
  const initial = createDraft(item, freezer, section);
  const locations: Record<FreezerId, SavedLocation> = {
    main: { section: "left", level: 1 },
    kimchi: { section: "body", level: 1 },
  };
  locations[initial.freezer] = { section: initial.section, level: initial.level };
  return locations;
}

export function ItemSheet({ item, defaultFreezer, defaultSection, onClose, onSave, onDelete }: Props) {
  const [draft, setDraft] = useState(() => createDraft(item, defaultFreezer, defaultSection));
  const locationMemory = useRef(createLocationMemory(item, defaultFreezer, defaultSection));

  useEffect(() => {
    const shell = document.querySelector<HTMLElement>(".site-shell");
    if (shell) shell.style.overflowY = "hidden";
    return () => {
      if (shell) shell.style.overflowY = "";
    };
  }, []);

  const changeFreezer = (freezer: FreezerId) => {
    setDraft((current) => {
      locationMemory.current[current.freezer] = { section: current.section, level: current.level };
      const saved = locationMemory.current[freezer];
      return { ...current, freezer, section: saved.section, level: saved.level };
    });
  };

  const changeLocation = (section: FreezerSection, level: 1 | 2 | 3) => {
    setDraft((current) => {
      locationMemory.current[current.freezer] = { section, level };
      return { ...current, section, level };
    });
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const name = draft.name.trim();
    if (!name || !Number.isFinite(draft.quantity) || draft.quantity <= 0) return;
    void onSave({ ...draft, name });
  };

  return (
    <div className="sheet-layer" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="bottom-sheet" role="dialog" aria-modal="true" aria-labelledby="item-sheet-title">
        <div className="sheet-handle" aria-hidden="true" />
        <div className="sheet-heading">
          <div>
            <p className="section-kicker">{item ? "품목 수정" : "새 품목"}</p>
            <h2 id="item-sheet-title">{item ? item.name : "냉동실에 추가하기"}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="닫기">
            <X size={21} />
          </button>
        </div>

        <form onSubmit={submit} className="item-form">
          <label className="field field-full">
            <span>품목 이름</span>
            <input
              autoFocus
              value={draft.name}
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              placeholder="예: 물만두"
              required
            />
          </label>

          <div className="form-row quantity-form-row">
            <div className="field">
              <span>수량</span>
              <div className="quantity-editor">
                <button type="button" onClick={() => setDraft({ ...draft, quantity: Math.max(0, draft.quantity - 1) })} aria-label="수량 줄이기">
                  <Minus size={18} />
                </button>
                <input
                  aria-label="수량 직접 입력"
                  inputMode="decimal"
                  min="0.01"
                  step="any"
                  type="number"
                  value={draft.quantity}
                  onChange={(event) => setDraft({ ...draft, quantity: Number(event.target.value) })}
                />
                <button type="button" onClick={() => setDraft({ ...draft, quantity: draft.quantity + 1 })} aria-label="수량 늘리기">
                  <Plus size={18} />
                </button>
              </div>
            </div>
            <label className="field unit-field">
              <span>단위</span>
              <span className="select-wrap">
                <select value={draft.unit} onChange={(event) => setDraft({ ...draft, unit: event.target.value })}>
                  {UNITS.map((unit) => <option key={unit}>{unit}</option>)}
                </select>
                <ChevronDown size={16} aria-hidden="true" />
              </span>
            </label>
          </div>

          <fieldset className="location-fieldset">
            <legend>보관 위치</legend>
            <div className="segmented compact">
              {(Object.keys(FREEZERS) as FreezerId[]).map((freezer) => (
                <button
                  className={draft.freezer === freezer ? "is-selected" : ""}
                  key={freezer}
                  type="button"
                  onClick={() => changeFreezer(freezer)}
                >
                  {FREEZERS[freezer].shortLabel}
                </button>
              ))}
            </div>
            <LocationSelector
              freezer={draft.freezer}
              section={draft.section}
              level={draft.level}
              onChange={changeLocation}
            />
          </fieldset>

          <details className="extra-fields">
            <summary>추가 정보 <ChevronDown size={16} /></summary>
            <label className="field">
              <span>소비기한</span>
              <input type="date" value={draft.expiresOn} onChange={(event) => setDraft({ ...draft, expiresOn: event.target.value })} />
            </label>
            <label className="field field-full">
              <span>메모</span>
              <textarea value={draft.memo} onChange={(event) => setDraft({ ...draft, memo: event.target.value })} placeholder="구입처, 용도 등" rows={2} />
            </label>
          </details>

          <button className="primary-button" type="submit" disabled={!draft.name.trim() || draft.quantity <= 0}>
            {item ? "변경사항 저장" : "냉동실에 추가"}
          </button>
          {item && onDelete ? (
            <button className="delete-button" type="button" onClick={() => void onDelete()}>
              <Trash2 size={17} /> 품목 삭제
            </button>
          ) : null}
        </form>
      </section>
    </div>
  );
}
