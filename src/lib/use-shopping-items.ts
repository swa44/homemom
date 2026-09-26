"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ShoppingItem } from "@/lib/types";

type ShoppingRow = {
  id: string;
  name: string;
  checked: boolean;
  created_at: string;
};

const fromRow = (row: ShoppingRow): ShoppingItem => ({
  id: row.id,
  name: row.name,
  checked: row.checked,
  createdAt: row.created_at,
});

export function useShoppingItems() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    void supabase.from("homemom_shopping").select("id,name,checked,created_at").order("created_at").then(({ data, error: fetchError }) => {
      if (!active) return;
      if (fetchError) setError("장보기 목록을 불러오지 못했어요.");
      else setItems(((data ?? []) as ShoppingRow[]).map(fromRow));
      setReady(true);
    });
    return () => { active = false; };
  }, []);

  const addItem = useCallback(async (name: string) => {
    const supabase = createClient();
    const { data, error: createError } = await supabase
      .from("homemom_shopping")
      .insert({ name })
      .select("id,name,checked,created_at")
      .single();
    if (createError || !data) {
      setError("장보기 항목을 추가하지 못했어요.");
      return false;
    }
    setItems((current) => [...current, fromRow(data as ShoppingRow)]);
    setError("");
    return true;
  }, []);

  const toggleItem = useCallback(async (item: ShoppingItem) => {
    const checked = !item.checked;
    const before = items;
    setItems((current) => current.map((candidate) => candidate.id === item.id ? { ...candidate, checked } : candidate));
    const supabase = createClient();
    const { error: updateError } = await supabase.from("homemom_shopping").update({ checked }).eq("id", item.id);
    if (updateError) {
      setItems(before);
      setError("체크 상태를 저장하지 못했어요.");
    } else setError("");
  }, [items]);

  const removeItem = useCallback(async (id: string) => {
    const before = items;
    setItems((current) => current.filter((item) => item.id !== id));
    const supabase = createClient();
    const { error: deleteError } = await supabase.from("homemom_shopping").delete().eq("id", id);
    if (deleteError) {
      setItems(before);
      setError("항목을 삭제하지 못했어요.");
    } else setError("");
  }, [items]);

  const clearChecked = useCallback(async () => {
    const before = items;
    setItems((current) => current.filter((item) => !item.checked));
    const supabase = createClient();
    const { error: deleteError } = await supabase.from("homemom_shopping").delete().eq("checked", true);
    if (deleteError) {
      setItems(before);
      setError("체크 항목을 비우지 못했어요.");
    } else setError("");
  }, [items]);

  return { items, ready, error, addItem, toggleItem, removeItem, clearChecked };
}
