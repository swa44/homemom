"use client";

import { useMemo, useState } from "react";
import { Box, MapPin, Plus, Search, X } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { ItemSheet } from "@/components/ItemSheet";
import { QuantityStepper } from "@/components/QuantityStepper";
import {
  FREEZERS,
  SECTIONS,
  getLocationLabel,
  type FreezerId,
  type FreezerItem,
  type FreezerSection,
} from "@/lib/types";
import { useFreezerItems } from "@/lib/use-freezer-items";

export function InventoryApp() {
  const { items, ready, error, createItem, updateItem, removeItem, updateQuantity } = useFreezerItems();
  const [activeFreezer, setActiveFreezer] = useState<FreezerId>("main");
  const [activeSection, setActiveSection] = useState<"all" | FreezerSection>("all");
  const [query, setQuery] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FreezerItem>();

  const normalizedQuery = query.trim().toLocaleLowerCase("ko");
  const visibleItems = useMemo(() => {
    return [...items]
      .filter((item) => {
        if (normalizedQuery) {
          return `${item.name} ${item.memo ?? ""}`.toLocaleLowerCase("ko").includes(normalizedQuery);
        }
        return item.freezer === activeFreezer && (activeSection === "all" || item.section === activeSection);
      })
      .sort((a, b) => a.name.localeCompare(b.name, "ko"));
  }, [activeFreezer, activeSection, items, normalizedQuery]);

  const counts = useMemo(() => ({
    main: items.filter((item) => item.freezer === "main").length,
    kimchi: items.filter((item) => item.freezer === "kimchi").length,
  }), [items]);

  const saveItem = async (draft: Omit<FreezerItem, "id" | "createdAt" | "updatedAt">) => {
    let saved = false;
    if (editingItem) {
      saved = await updateItem(editingItem.id, draft);
    } else {
      saved = await createItem(draft);
    }
    if (saved) {
      setActiveFreezer(draft.freezer);
      setActiveSection("all");
      setQuery("");
      setEditingItem(undefined);
      setSheetOpen(false);
    }
  };

  const openAddSheet = () => {
    setEditingItem(undefined);
    setSheetOpen(true);
  };

  const openEditSheet = (item: FreezerItem) => {
    setEditingItem(item);
    setSheetOpen(true);
  };

  return (
    <>
      <main className="page inventory-page">
        <AppHeader eyebrow="두 냉동실을 한눈에" />

        <section className="hero-copy">
          <p>뭘 찾으세요?</p>
          <h2>이름만 검색하면<br />어느 칸인지 바로 보여드려요.</h2>
        </section>

        <label className="search-box">
          <Search size={21} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="예: 만두, 소고기, 대파"
            aria-label="냉동식품 검색"
          />
          {query ? <button type="button" onClick={() => setQuery("")} aria-label="검색어 지우기"><X size={18} /></button> : null}
        </label>

        {!normalizedQuery ? (
          <>
            <div className="segmented freezer-tabs" aria-label="냉동실 선택">
              {(Object.keys(FREEZERS) as FreezerId[]).map((freezer) => (
                <button
                  key={freezer}
                  type="button"
                  className={activeFreezer === freezer ? "is-selected" : ""}
                  onClick={() => { setActiveFreezer(freezer); setActiveSection("all"); }}
                >
                  <span>{FREEZERS[freezer].shortLabel}</span>
                  <strong>{counts[freezer]}</strong>
                </button>
              ))}
            </div>
            <div className="filter-row" aria-label="구역 선택">
              <button className={activeSection === "all" ? "is-selected" : ""} onClick={() => setActiveSection("all")} type="button">전체</button>
              {SECTIONS[activeFreezer].map((section) => (
                <button key={section.id} className={activeSection === section.id ? "is-selected" : ""} onClick={() => setActiveSection(section.id)} type="button">
                  {section.label}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="search-summary">
            <span>전체 냉동실 검색</span>
            <strong>{visibleItems.length}개 결과</strong>
          </div>
        )}

        <section className="list-section" aria-live="polite">
          {error ? <p className="error-banner" role="alert">{error}</p> : null}
          {!ready ? (
            <div className="loading-list" aria-label="목록 불러오는 중"><span /><span /><span /></div>
          ) : visibleItems.length ? (
            <div className="item-list">
              {visibleItems.map((item) => (
                <article className="item-row" key={item.id}>
                  <button className="item-info" type="button" onClick={() => openEditSheet(item)}>
                    <strong>{item.name}</strong>
                    <span><MapPin size={14} aria-hidden="true" /> {getLocationLabel(item)}</span>
                    {item.memo ? <small>{item.memo}</small> : null}
                  </button>
                  <QuantityStepper
                    key={`${item.id}-${item.quantity}`}
                    itemName={item.name}
                    quantity={item.quantity}
                    unit={item.unit}
                    onChange={(quantity) => void updateQuantity(item, quantity)}
                  />
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span className="empty-icon">{normalizedQuery ? <Search size={25} /> : <Box size={27} />}</span>
              <h3>{normalizedQuery ? `“${query.trim()}”을 찾지 못했어요` : "아직 등록된 품목이 없어요"}</h3>
              <p>{normalizedQuery ? "다른 이름으로 검색하거나 새 품목을 추가해 보세요." : "무엇이 어느 칸에 있는지 지금부터 기록해 보세요."}</p>
              <button className="secondary-button" type="button" onClick={openAddSheet}><Plus size={17} /> 첫 품목 추가</button>
            </div>
          )}
        </section>
      </main>

      <button className="fab" type="button" onClick={openAddSheet} aria-label="새 냉동 품목 추가">
        <Plus size={25} strokeWidth={2.5} />
        <span>추가</span>
      </button>

      {sheetOpen ? (
        <ItemSheet
          item={editingItem}
          defaultFreezer={activeFreezer}
          defaultSection={activeSection === "all" ? undefined : activeSection}
          onClose={() => { setSheetOpen(false); setEditingItem(undefined); }}
          onSave={saveItem}
          onDelete={editingItem ? async () => {
            const removed = await removeItem(editingItem.id);
            if (removed) {
              setSheetOpen(false);
              setEditingItem(undefined);
            }
          } : undefined}
        />
      ) : null}
    </>
  );
}
