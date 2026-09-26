"use client";

import { useState } from "react";
import { Check, Copy, DoorOpen, Plus, Refrigerator, UserPlus, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { ApplianceType } from "@/lib/types";
import { useFreezers } from "@/lib/use-freezers";

type PreviewZone = {
  key: string;
  label: string;
  levels: number;
  type: "body" | "door";
};

function levelLabel(position: number, count: number) {
  if (count === 1) return "전체";
  if (count === 2) return position === 0 ? "상단" : "하단";
  if (count === 3) return ["상단", "중단", "하단"][position];
  return `${position + 1}단`;
}

function FreezerLayoutPreview({ type, bodyLevels, hasDoor, doorLevels }: { type: ApplianceType; bodyLevels: number; hasDoor: boolean; doorLevels: number }) {
  const zones: PreviewZone[] = type === "side_by_side"
    ? [
        ...(hasDoor ? [{ key: "left-door", label: "왼쪽 문", levels: doorLevels, type: "door" as const }] : []),
        { key: "left-body", label: "왼쪽 본체", levels: bodyLevels, type: "body" },
        { key: "right-body", label: "오른쪽 본체", levels: bodyLevels, type: "body" },
        ...(hasDoor ? [{ key: "right-door", label: "오른쪽 문", levels: doorLevels, type: "door" as const }] : []),
      ]
    : [
        { key: "body", label: "본체", levels: bodyLevels, type: "body" },
        ...(hasDoor ? [{ key: "door", label: "문", levels: doorLevels, type: "door" as const }] : []),
      ];

  return (
    <figure className="freezer-layout-preview">
      <figcaption>
        <span>구성 미리보기</span>
        <strong>{type === "side_by_side" ? "양문형" : "일반형"}{hasDoor ? " · 문 수납 포함" : " · 본체만"}</strong>
      </figcaption>
      <div
        className={`freezer-preview-cabinet is-${type}`}
        key={`${type}-${hasDoor ? "door" : "no-door"}`}
        style={{ gridTemplateColumns: zones.map((zone) => zone.type === "door" ? "0.72fr" : "1fr").join(" ") }}
      >
        {zones.map((zone) => (
          <div className={`freezer-preview-zone is-${zone.type}`} key={zone.key}>
            <span>{zone.label}</span>
            <div className="freezer-preview-levels" style={{ gridTemplateRows: `repeat(${zone.levels}, minmax(0, 1fr))` }}>
              {Array.from({ length: zone.levels }, (_, index) => (
                <div key={`${zone.key}-${index}`}><span>{levelLabel(index, zone.levels)}</span></div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p>본체 {bodyLevels}칸{hasDoor ? ` · 문 수납 ${doorLevels}칸` : " · 문 수납 없음"}</p>
    </figure>
  );
}

export function FreezerManagementCard() {
  const { freezers, ready, error: loadError, reload } = useFreezers();
  const [adding, setAdding] = useState(false);
  const [working, setWorking] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<ApplianceType>("side_by_side");
  const [bodyLevels, setBodyLevels] = useState(3);
  const [hasDoor, setHasDoor] = useState(true);
  const [doorLevels, setDoorLevels] = useState(3);
  const [shareHousehold, setShareHousehold] = useState(true);
  const [joinCode, setJoinCode] = useState("");
  const [copiedId, setCopiedId] = useState("");
  const [error, setError] = useState("");

  const createFreezer = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    setWorking(true);
    setError("");
    const supabase = createClient();
    const { error: createError } = await supabase.rpc("homemom_create_freezer", {
      requested_name: name.trim(),
      requested_type: type,
      requested_body_levels: bodyLevels,
      requested_has_door: hasDoor,
      requested_door_levels: hasDoor ? doorLevels : 0,
      requested_share_household: shareHousehold,
    });
    if (createError) {
      setError("냉장고를 추가하지 못했어요. 다중 냉장고 SQL과 입력값을 확인해 주세요.");
    } else {
      setName("");
      setAdding(false);
      await reload();
    }
    setWorking(false);
  };

  const joinFreezer = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!joinCode.trim()) return;
    setWorking(true);
    setError("");
    const supabase = createClient();
    const { error: joinError } = await supabase.rpc("homemom_join_freezer", { requested_code: joinCode.trim().toUpperCase() });
    if (joinError) setError("냉장고 초대 코드를 확인해 주세요.");
    else {
      setJoinCode("");
      await reload();
    }
    setWorking(false);
  };

  const copyCode = async (id: string, code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedId(id);
    window.setTimeout(() => setCopiedId(""), 1500);
  };

  return (
    <section className="settings-group freezer-management-group">
      <div className="settings-section-heading">
        <h3>냉장고 관리</h3>
        <button type="button" onClick={() => setAdding((current) => !current)}>{adding ? <X size={15} /> : <Plus size={15} />}{adding ? "닫기" : "냉장고 추가"}</button>
      </div>

      {adding ? (
        <form className="freezer-create-form" onSubmit={createFreezer}>
          <label className="field"><span>냉장고 이름</span><input value={name} maxLength={40} onChange={(event) => setName(event.target.value)} placeholder="예: 차고 냉장고" /></label>
          <div className="appliance-type-picker">
            <button type="button" className={type === "side_by_side" ? "is-selected" : ""} onClick={() => setType("side_by_side")}><Refrigerator size={18} />양문형</button>
            <button type="button" className={type === "standard" ? "is-selected" : ""} onClick={() => setType("standard")}><DoorOpen size={18} />일반형</button>
          </div>
          <div className="freezer-level-inputs">
            <label><span>본체 칸 수</span><input type="number" min={1} max={10} value={bodyLevels} onChange={(event) => setBodyLevels(Math.min(10, Math.max(1, Number(event.target.value))))} /></label>
            <label className="door-storage-toggle"><input type="checkbox" checked={hasDoor} onChange={(event) => setHasDoor(event.target.checked)} /><span>문 수납 사용</span></label>
            {hasDoor ? <label><span>문 수납 칸 수</span><input type="number" min={1} max={10} value={doorLevels} onChange={(event) => setDoorLevels(Math.min(10, Math.max(1, Number(event.target.value))))} /></label> : null}
          </div>
          <FreezerLayoutPreview type={type} bodyLevels={bodyLevels} hasDoor={hasDoor} doorLevels={doorLevels} />
          <label className="share-household-toggle"><input type="checkbox" checked={shareHousehold} onChange={(event) => setShareHousehold(event.target.checked)} /><span><strong>우리 집 가족과 공유</strong><small>가족 구성원의 냉장고 탭에도 함께 표시됩니다.</small></span></label>
          <button className="primary-button" type="submit" disabled={working || !name.trim()}><Plus size={17} /> 냉장고 추가</button>
        </form>
      ) : null}

      <div className="managed-freezer-list">
        {!ready ? <div className="family-loading">냉장고를 불러오는 중…</div> : freezers.map((freezer) => (
          <article className="managed-freezer" key={freezer.id}>
            <div className="managed-freezer-title"><span className="settings-icon"><Refrigerator size={19} /></span><div><strong>{freezer.name}</strong><small>{freezer.applianceType === "side_by_side" ? "양문형" : "일반형"} · {freezer.zones.reduce((total, zone) => total + zone.compartments.length, 0)}칸</small></div></div>
            <div className="freezer-share-code"><span>냉장고 공유 코드</span><strong>{freezer.inviteCode}</strong><button type="button" onClick={() => void copyCode(freezer.id, freezer.inviteCode)}>{copiedId === freezer.id ? <Check size={15} /> : <Copy size={15} />}</button></div>
          </article>
        ))}
      </div>

      <form className="join-freezer-form" onSubmit={joinFreezer}>
        <label><span>다른 집 냉장고 추가</span><input value={joinCode} maxLength={10} onChange={(event) => setJoinCode(event.target.value.toUpperCase())} placeholder="냉장고 코드 10자리" /></label>
        <button type="submit" disabled={working || !joinCode.trim()}><UserPlus size={16} /> 추가</button>
      </form>
      {error || loadError ? <p className="family-error" role="alert">{error || loadError}</p> : null}
    </section>
  );
}
