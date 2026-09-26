import {
  FREEZERS,
  LEVELS,
  getLevelLabel,
  type FreezerId,
  type FreezerSection,
} from "@/lib/types";

type Props = {
  freezer: FreezerId;
  section: FreezerSection;
  level: 1 | 2 | 3;
  onChange: (section: FreezerSection, level: 1 | 2 | 3) => void;
};

const VISUAL_SECTIONS: Record<FreezerId, { id: FreezerSection; label: string; kind: "body" | "door" }[]> = {
  main: [
    { id: "left_door", label: "좌측 문", kind: "door" },
    { id: "left", label: "좌측 본체", kind: "body" },
    { id: "right", label: "우측 본체", kind: "body" },
    { id: "right_door", label: "우측 문", kind: "door" },
  ],
  kimchi: [
    { id: "body", label: "본체", kind: "body" },
    { id: "door", label: "문", kind: "door" },
  ],
};

export function LocationSelector({ freezer, section, level, onChange }: Props) {
  const sections = VISUAL_SECTIONS[freezer];
  const selectedSection = sections.find((candidate) => candidate.id === section) ?? sections[0];

  return (
    <div>
      <div className={`freezer-diagram freezer-diagram-${freezer}`} aria-label={`${FREEZERS[freezer].shortLabel} 위치 선택`}>
        {sections.map((candidate) => (
          <div
            className={`freezer-zone is-${candidate.kind} is-${candidate.id.replace("_", "-")}`}
            key={candidate.id}
          >
            <span className="freezer-zone-label">{candidate.label}</span>
            <div className="freezer-levels">
              {LEVELS.map((candidateLevel) => {
                const selected = section === candidate.id && level === candidateLevel.id;
                return (
                  <button
                    aria-label={`${FREEZERS[freezer].shortLabel} ${candidate.label} ${candidateLevel.label}`}
                    aria-pressed={selected}
                    className={selected ? "is-selected" : ""}
                    key={candidateLevel.id}
                    onClick={() => onChange(candidate.id, candidateLevel.id)}
                    type="button"
                  >
                    {candidateLevel.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <p className="selected-location" aria-live="polite">
        <span>선택 위치</span>
        <strong>{FREEZERS[freezer].shortLabel} · {selectedSection.label} · {getLevelLabel(level)}</strong>
      </p>
    </div>
  );
}
