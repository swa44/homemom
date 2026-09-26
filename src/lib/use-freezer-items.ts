"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { FreezerItem } from "@/lib/types";

type ItemDraft = Omit<FreezerItem, "id" | "createdAt" | "updatedAt">;

type ItemRow = {
  id: string;
  name: string;
  quantity: number | string;
  unit: string;
  freezer_id: string;
  compartment_id: string;
  expires_on: string | null;
  memo: string | null;
  created_at: string;
  updated_at: string;
};

function fromRow(row: ItemRow): FreezerItem {
  return {
    id: row.id,
    name: row.name,
    quantity: Number(row.quantity),
    unit: row.unit,
    freezerId: row.freezer_id,
    compartmentId: row.compartment_id,
    expiresOn: row.expires_on ?? "",
    memo: row.memo ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRow(draft: ItemDraft) {
  return {
    name: draft.name,
    quantity: draft.quantity,
    unit: draft.unit,
    freezer_id: draft.freezerId,
    compartment_id: draft.compartmentId,
    expires_on: draft.expiresOn || null,
    memo: draft.memo?.trim() || null,
  };
}

export function useFreezerItems() {
  const [items, setItems] = useState<FreezerItem[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    const loadItems = async () => {
      const { data, error: fetchError } = await supabase
        .from("homemom_items")
        .select("id,name,quantity,unit,freezer_id,compartment_id,expires_on,memo,created_at,updated_at")
        .order("name");
      if (!active) return;
      if (fetchError) setError("냉동실 목록을 불러오지 못했어요.");
      else {
        setItems(((data ?? []) as ItemRow[]).map(fromRow));
        setError("");
      }
      setReady(true);
    };

    void loadItems();
    const channel = supabase
      .channel("homemom-shared-freezer")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "homemom_items" },
        () => void loadItems(),
      )
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, []);

  const createItem = useCallback(async (draft: ItemDraft) => {
    const supabase = createClient();
    const { data, error: createError } = await supabase
      .from("homemom_items")
      .insert(toRow(draft))
      .select("id,name,quantity,unit,freezer_id,compartment_id,expires_on,memo,created_at,updated_at")
      .single();
    if (createError || !data) {
      setError("품목을 저장하지 못했어요.");
      return false;
    }
    setItems((current) => [...current, fromRow(data as ItemRow)]);
    setError("");
    return true;
  }, []);

  const updateItem = useCallback(async (id: string, draft: ItemDraft) => {
    const before = items;
    const now = new Date().toISOString();
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...draft, updatedAt: now } : item));
    const supabase = createClient();
    const { error: updateError } = await supabase.from("homemom_items").update(toRow(draft)).eq("id", id);
    if (updateError) {
      setItems(before);
      setError("변경사항을 저장하지 못했어요.");
      return false;
    }
    setError("");
    return true;
  }, [items]);

  const removeItem = useCallback(async (id: string) => {
    const before = items;
    setItems((current) => current.filter((item) => item.id !== id));
    const supabase = createClient();
    const { error: deleteError } = await supabase.from("homemom_items").delete().eq("id", id);
    if (deleteError) {
      setItems(before);
      setError("삭제하지 못했어요. 품목을 다시 표시했어요.");
      return false;
    }
    setError("");
    return true;
  }, [items]);

  const updateQuantity = useCallback(async (item: FreezerItem, quantity: number) => {
    if (quantity <= 0) return removeItem(item.id);
    const before = items;
    setItems((current) => current.map((candidate) => candidate.id === item.id
      ? { ...candidate, quantity, updatedAt: new Date().toISOString() }
      : candidate));
    const supabase = createClient();
    const { error: updateError } = await supabase.from("homemom_items").update({ quantity }).eq("id", item.id);
    if (updateError) {
      setItems(before);
      setError("수량을 저장하지 못해 이전 값으로 돌렸어요.");
      return false;
    }
    setError("");
    return true;
  }, [items, removeItem]);

  return { items, ready, error, createItem, updateItem, removeItem, updateQuantity };
}
