"use client";

import { useMemo, useState } from "react";
import { Box, MapPin, Plus, Search, X } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { ItemDetailSheet } from "@/components/ItemDetailSheet";
import { ItemSheet } from "@/components/ItemSheet";
import { QuantityStepper } from "@/components/QuantityStepper";
import {
  getCompartmentLocation,
  getFreezer,
  getLocationLabel,
  type FreezerItem,
} from "@/lib/types";
import { useFreezerItems } from "@/lib/use-freezer-items";
import { useFreezers } from "@/lib/use-freezers";

export function InventoryApp() {
  const { items, ready, error, createItem, updateItem, removeItem, updateQuantity } = useFreezerItems();
  const { freezers, ready: freezersReady, error: freezerError } = useFreezers();
  const [activeFreezerId, setActiveFreezerId] = useState("all");
  const [activeZoneId, setActiveZoneId] = useState("all");
  const [query, setQuery] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FreezerItem>();
  const [viewingItem, setViewingItem] = useState<FreezerItem>();

  const normalizedQuery = query.trim().toLocaleLowerCase("ko");
  const visibleItems = useMemo(() => {
    return [...items]
      .filter((item) => {
        if (normalizedQuery) {
          return `${item.name} ${item.memo ?? ""}`.toLocaleLowerCase("ko").includes(normalizedQuery);
        }
        if (activeFreezerId !== "all" && item.freezerId !== activeFreezerId) return false;
        if (activeZoneId !== "all") {
          const freezer = getFreezer(freezers, item.freezerId);
          return getCompartmentLocation(freezer, item.compartmentId)?.zone.id === activeZoneId;
        }
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name, "ko"));
  }, [activeFreezerId, activeZoneId, freezers, items, normalizedQuery]);

  const counts = useMemo(() => new Map(freezers.map((freezer) => [
    freezer.id,
    items.filter((item) => item.freezerId === freezer.id).length,
  ])), [freezers, items]);
  const activeFreezer = getFreezer(freezers, activeFreezerId);

  const saveItem = async (draft: Omit<FreezerItem, "id" | "createdAt" | "updatedAt">) => {
    let saved = false;
    if (editingItem) {
      saved = await updateItem(editingItem.id, draft);
    } else {
      saved = await createItem(draft);
    }
    if (saved) {
      setActiveFreezerId(draft.freezerId);
      setActiveZoneId("all");
      setQuery("");
      setEditingItem(undefined);
      setSheetOpen(false);
    }
  };

  const openAddSheet = () => {
    if (!freezers.length) return;
    setEditingItem(undefined);
    setSheetOpen(true);
  };

  const openEditSheet = (item: FreezerItem) => {
    setViewingItem(undefined);
    setEditingItem(item);
    setSheetOpen(true);
  };

  const changeQuantity = async (item: FreezerItem, quantity: number) => {
    if (item.quantity > 0 && quantity <= 0) {
      const shouldEmpty = window.confirm(
        `“${item.name}” 수량을 0으로 만들고 냉동실 목록에서 비울까요?`,
      );
      if (!shouldEmpty) return false;
    }
    return updateQuantity(item, quantity);
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
            <div className="freezer-tab-scroll" aria-label="냉장고 선택">
              <button
                type="button"
                className={activeFreezerId === "all" ? "is-selected" : ""}
                onClick={() => { setActiveFreezerId("all"); setActiveZoneId("all"); }}
              >
                <span>전체</span><strong>{items.length}</strong>
              </button>
              {freezers.map((freezer) => (
                <button
                  key={freezer.id}
                  type="button"
                  className={activeFreezerId === freezer.id ? "is-selected" : ""}
                  onClick={() => { setActiveFreezerId(freezer.id); setActiveZoneId("all"); }}
                >
                  <span>{freezer.name}</span>
                  <strong>{counts.get(freezer.id) ?? 0}</strong>
                </button>
              ))}
            </div>
            {activeFreezer ? (
              <div className="filter-row" aria-label="구역 선택">
                <button className={activeZoneId === "all" ? "is-selected" : ""} onClick={() => setActiveZoneId("all")} type="button">전체</button>
                {activeFreezer.zones.map((zone) => (
                  <button key={zone.id} className={activeZoneId === zone.id ? "is-selected" : ""} onClick={() => setActiveZoneId(zone.id)} type="button">{zone.label}</button>
                ))}
              </div>
            ) : null}
          </>
        ) : (
          <div className="search-summary">
            <span>전체 냉동실 검색</span>
            <strong>{visibleItems.length}개 결과</strong>
          </div>
        )}

        <section className="list-section" aria-live="polite">
          {error || freezerError ? <p className="error-banner" role="alert">{error || freezerError}</p> : null}
          {!ready || !freezersReady ? (
            <div className="loading-list" aria-label="목록 불러오는 중"><span /><span /><span /></div>
          ) : visibleItems.length ? (
            <div className="item-list">
              {visibleItems.map((item) => (
                <article className="item-row" key={item.id}>
                  <button className="item-info" type="button" onClick={() => setViewingItem(item)}>
                    <strong>{item.name}</strong>
                    <span><MapPin size={14} aria-hidden="true" /> {getLocationLabel(item, freezers)}</span>
                    {item.memo ? <small>{item.memo}</small> : null}
                  </button>
                  <QuantityStepper
                    key={`${item.id}-${item.quantity}`}
                    itemName={item.name}
                    quantity={item.quantity}
                    unit={item.unit}
                    onChange={(quantity) => changeQuantity(item, quantity)}
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

      {viewingItem ? (
        <ItemDetailSheet
          item={viewingItem}
          freezers={freezers}
          onClose={() => setViewingItem(undefined)}
          onEdit={() => openEditSheet(viewingItem)}
        />
      ) : null}

      {sheetOpen ? (
        <ItemSheet
          item={editingItem}
          freezers={freezers}
          defaultFreezerId={activeFreezerId === "all" ? freezers[0]?.id ?? "" : activeFreezerId}
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
