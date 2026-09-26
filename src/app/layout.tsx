import type { Metadata, Viewport } from "next";
import { BottomNav } from "@/components/BottomNav";
import { PwaInstallProvider } from "@/components/PwaInstallProvider";
import { PwaRegister } from "@/components/PwaRegister";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://homemom.vercel.app"),
  title: "홈맘 — 냉동실 관리",
  description: "두 냉동실의 품목과 정확한 보관 위치를 빠르게 찾는 개인용 냉동실 관리 앱",
  applicationName: "홈맘",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "홈맘" },
  icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }, { url: "/icon-192.png", sizes: "192x192", type: "image/png" }], apple: "/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#243f58",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <PwaInstallProvider>
          <div className="site-shell">
            {children}
            <BottomNav />
          </div>
          <PwaRegister />
        </PwaInstallProvider>
      </body>
    </html>
  );
}
