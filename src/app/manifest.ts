import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "홈맘 — 냉동실 관리",
    short_name: "홈맘",
    description: "두 냉동실의 품목과 보관 위치를 빠르게 찾는 앱",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f5f7f6",
    theme_color: "#243f58",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
