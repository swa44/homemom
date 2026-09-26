"use client";

import { useMemo, useState } from "react";
import { Check, ListChecks, Plus, Trash2 } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { useShoppingItems } from "@/lib/use-shopping-items";

export function ShoppingApp() {
  const { items, ready, error, addItem, toggleItem, removeItem, clearChecked } = useShoppingItems();
  const [name, setName] = useState("");
  const sortedItems = useMemo(() => [...items].sort((a, b) => Number(a.checked) - Number(b.checked) || a.createdAt.localeCompare(b.createdAt)), [items]);
  const uncheckedCount = items.filter((item) => !item.checked).length;
  const checkedCount = items.length - uncheckedCount;

  const submitItem = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;
    if (await addItem(trimmedName)) setName("");
  };

  return (
    <main className="page shopping-page">
      <AppHeader eyebrow="필요한 것만 간단하게" />
      <section className="page-title-row">
        <div>
          <p className="section-kicker coral">장보기</p>
          <h2>잊지 말고 챙겨요.</h2>
        </div>
        {items.length ? <span className="count-badge">남은 것 {uncheckedCount}</span> : null}
      </section>

      <form className="quick-add" onSubmit={submitItem}>
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="살 것을 입력하세요" aria-label="장보기 항목" />
        <button type="submit" disabled={!name.trim()} aria-label="장보기 항목 추가"><Plus size={21} /></button>
      </form>

      <section className="shopping-list" aria-live="polite">
        {error ? <p className="error-banner" role="alert">{error}</p> : null}
        {!ready ? (
          <div className="loading-list"><span /><span /><span /></div>
        ) : sortedItems.length ? sortedItems.map((item) => (
          <article className={`shopping-row ${item.checked ? "is-checked" : ""}`} key={item.id}>
            <button
              className="check-button"
              type="button"
              aria-label={`${item.name} ${item.checked ? "체크 해제" : "구매 완료"}`}
              onClick={() => void toggleItem(item)}
            >
              {item.checked ? <Check size={16} strokeWidth={3} /> : null}
            </button>
            <button
              className="shopping-name"
              type="button"
              onClick={() => void toggleItem(item)}
            >
              {item.name}
            </button>
            <button className="row-delete" type="button" aria-label={`${item.name} 삭제`} onClick={() => void removeItem(item.id)}>
              <Trash2 size={18} />
            </button>
          </article>
        )) : (
          <div className="empty-state shopping-empty">
            <span className="empty-icon coral-bg"><ListChecks size={27} /></span>
            <h3>장보기 목록이 비어 있어요</h3>
            <p>생각나는 순간 바로 위에 적어두세요.</p>
          </div>
        )}
      </section>

      {checkedCount ? (
        <button className="clear-completed" type="button" onClick={() => void clearChecked()}>
          체크한 {checkedCount}개 항목 비우기
        </button>
      ) : null}
    </main>
  );
}
