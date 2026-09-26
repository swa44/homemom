"use client";

import { useEffect } from "react";
import { CalendarDays, Pencil, X } from "lucide-react";
import { LocationSelector } from "@/components/LocationSelector";
import { getFreezer, type FreezerDefinition, type FreezerItem } from "@/lib/types";

type Props = {
  item: FreezerItem;
  freezers: FreezerDefinition[];
  onClose: () => void;
  onEdit: () => void;
};

export function ItemDetailSheet({ item, freezers, onClose, onEdit }: Props) {
  const freezer = getFreezer(freezers, item.freezerId);
  useEffect(() => {
    const shell = document.querySelector<HTMLElement>(".site-shell");
    if (shell) shell.style.overflowY = "hidden";
    return () => {
      if (shell) shell.style.overflowY = "";
    };
  }, []);

  return (
    <div className="sheet-layer" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="bottom-sheet detail-sheet" role="dialog" aria-modal="true" aria-labelledby="item-detail-title">
        <div className="sheet-handle" aria-hidden="true" />
        <div className="sheet-heading">
          <div>
            <p className="section-kicker">위치 확인</p>
            <h2 id="item-detail-title">{item.name}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="닫기">
            <X size={21} />
          </button>
        </div>

        <div className="item-detail-quantity">
          <span>현재 수량</span>
          <strong>{item.quantity}<small>{item.unit}</small></strong>
        </div>

        <div className="item-detail-location">
          <div className="item-detail-location-heading">
            <span className="detail-label">보관 위치</span>
            <strong>{freezer?.name ?? "냉장고"}</strong>
          </div>
          {freezer ? <LocationSelector freezer={freezer} compartmentId={item.compartmentId} readOnly /> : null}
        </div>

        {item.expiresOn || item.memo ? (
          <div className="item-detail-extra">
            {item.expiresOn ? <p><CalendarDays size={15} /> 소비기한 {item.expiresOn}</p> : null}
            {item.memo ? <p>{item.memo}</p> : null}
          </div>
        ) : null}

        <button className="primary-button" type="button" onClick={onEdit}>
          <Pencil size={17} /> 수정하기
        </button>
      </section>
    </div>
  );
}
