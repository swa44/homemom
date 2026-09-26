import { Snowflake } from "lucide-react";

export function AppHeader({ eyebrow, title }: { eyebrow?: string; title?: string }) {
  return (
    <header className="app-header">
      <div className="brand-mark" aria-hidden="true">
        <Snowflake size={21} strokeWidth={2.4} />
      </div>
      <div>
        {eyebrow ? <p className="header-eyebrow">{eyebrow}</p> : null}
        <h1>{title ?? "홈맘"}</h1>
      </div>
    </header>
  );
}
