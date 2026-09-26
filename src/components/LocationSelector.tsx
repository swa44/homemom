import { getCompartmentLocation, type FreezerDefinition } from "@/lib/types";

type Props = {
  freezer: FreezerDefinition;
  compartmentId: string;
  onChange?: (compartmentId: string) => void;
  readOnly?: boolean;
};

export function LocationSelector({ freezer, compartmentId, onChange, readOnly = false }: Props) {
  const selected = getCompartmentLocation(freezer, compartmentId);
  const columns = freezer.zones.map((zone) => zone.type === "door" ? "0.74fr" : "1fr").join(" ");

  return (
    <div>
      <div
        className={`freezer-diagram${readOnly ? " is-readonly" : ""}`}
        style={{ gridTemplateColumns: columns }}
        aria-label={`${freezer.name} 위치 ${readOnly ? "표시" : "선택"}`}
      >
        {freezer.zones.map((zone) => (
          <div className={`freezer-zone is-${zone.type} is-${zone.side}-${zone.type}`} key={zone.id}>
            <span className="freezer-zone-label">{zone.label}</span>
            <div className="freezer-levels" style={{ gridTemplateRows: `repeat(${zone.compartments.length}, minmax(46px, 1fr))` }}>
              {zone.compartments.map((compartment) => {
                const isSelected = compartment.id === compartmentId;
                return (
                  <button
                    aria-label={`${freezer.name} ${zone.label} ${compartment.label}`}
                    aria-pressed={isSelected}
                    className={isSelected ? "is-selected" : ""}
                    disabled={readOnly}
                    key={compartment.id}
                    onClick={() => onChange?.(compartment.id)}
                    type="button"
                  >
                    {compartment.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <p className="selected-location" aria-live="polite">
        <span>선택 위치</span>
        <strong>{freezer.name} · {selected?.zone.label ?? "위치"} · {selected?.compartment.label ?? "선택 필요"}</strong>
      </p>
    </div>
  );
}
