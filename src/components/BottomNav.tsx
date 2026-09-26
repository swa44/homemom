"use client";

import Link from "next/link";
import { ListChecks, Settings, Snowflake } from "lucide-react";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "냉동실", icon: Snowflake },
  { href: "/shopping", label: "장보기", icon: ListChecks },
  { href: "/settings", label: "설정", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  if (pathname === "/login" || pathname.startsWith("/auth/")) return null;

  return (
    <nav className="bottom-nav" aria-label="주요 메뉴">
      {tabs.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link className={`nav-item ${active ? "is-active" : ""}`} href={href} key={href}>
            <Icon aria-hidden="true" size={22} strokeWidth={active ? 2.6 : 2} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
