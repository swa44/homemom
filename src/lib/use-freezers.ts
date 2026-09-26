"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ApplianceType, FreezerDefinition, FreezerZone } from "@/lib/types";

type FreezerRow = { id: string; name: string; appliance_type: ApplianceType; owner_id: string; share_with_household: boolean; invite_code: string; created_at: string };
type ZoneRow = { id: string; freezer_id: string; zone_key: string; label: string; zone_type: "body" | "door"; side: "left" | "right" | "single"; position: number };
type CompartmentRow = { id: string; zone_id: string; label: string; position: number };

export function useFreezers() {
  const [freezers, setFreezers] = useState<FreezerDefinition[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    const supabase = createClient();
    const [freezerResult, zoneResult, compartmentResult] = await Promise.all([
      supabase.from("homemom_freezers").select("id,name,appliance_type,owner_id,share_with_household,invite_code,created_at").order("created_at"),
      supabase.from("homemom_freezer_zones").select("id,freezer_id,zone_key,label,zone_type,side,position").order("position"),
      supabase.from("homemom_freezer_compartments").select("id,zone_id,label,position").order("position"),
    ]);
    if (freezerResult.error || zoneResult.error || compartmentResult.error) {
      setError("냉장고 정보를 불러오지 못했어요. 설정에서 다중 냉장고 SQL을 확인해 주세요.");
      setReady(true);
      return;
    }
    const zones = (zoneResult.data ?? []) as ZoneRow[];
    const compartments = (compartmentResult.data ?? []) as CompartmentRow[];
    setFreezers(((freezerResult.data ?? []) as FreezerRow[]).map((freezer) => ({
      id: freezer.id,
      name: freezer.name,
      applianceType: freezer.appliance_type,
      ownerId: freezer.owner_id,
      shareWithHousehold: freezer.share_with_household,
      inviteCode: freezer.invite_code,
      createdAt: freezer.created_at,
      zones: zones.filter((zone) => zone.freezer_id === freezer.id).map((zone): FreezerZone => ({
        id: zone.id,
        key: zone.zone_key,
        label: zone.label,
        type: zone.zone_type,
        side: zone.side,
        position: zone.position,
        compartments: compartments.filter((compartment) => compartment.zone_id === zone.id),
      })),
    })));
    setError("");
    setReady(true);
  }, []);

  useEffect(() => { queueMicrotask(() => void reload()); }, [reload]);
  return { freezers, ready, error, reload };
}
