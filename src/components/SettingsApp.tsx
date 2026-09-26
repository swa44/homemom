"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Download, LogOut, ShieldCheck, Trash2, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { FamilySharingCard } from "@/components/FamilySharingCard";
import { createClient } from "@/lib/supabase/client";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function SettingsApp() {
  const router = useRouter();
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [nickname, setNickname] = useState("카카오 사용자");

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    queueMicrotask(() => setInstalled(standalone));
    const capture = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", capture);
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => {
      const metadata = data.user?.user_metadata;
      setNickname(metadata?.full_name ?? metadata?.name ?? metadata?.preferred_username ?? "카카오 사용자");
    });
    return () => window.removeEventListener("beforeinstallprompt", capture);
  }, []);

  const clearData = async () => {
    if (!window.confirm("냉동실과 장보기 기록을 모두 삭제할까요? 삭제 후 복구할 수 없습니다.")) return;
    const supabase = createClient();
    const [{ error: itemsError }, { error: shoppingError }] = await Promise.all([
      supabase.from("homemom_items").delete().not("id", "is", null),
      supabase.from("homemom_shopping").delete().not("id", "is", null),
    ]);
    if (itemsError || shoppingError) {
      window.alert("기록을 모두 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.");
      return;
    }
    router.push("/");
    router.refresh();
  };

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  };

  return (
    <main className="page settings-page">
      <AppHeader eyebrow="앱과 데이터 관리" />
      <section className="page-title-row">
        <div>
          <p className="section-kicker">설정</p>
          <h2>홈맘 설정</h2>
        </div>
      </section>

      <section className="settings-card">
        <div className="settings-icon"><UserRound size={20} /></div>
        <div className="settings-copy">
          <strong>{nickname}</strong>
          <p>카카오 계정으로 안전하게 동기화 중입니다.</p>
        </div>
        <span className="status-pill"><CheckCircle2 size={14} /> 연결됨</span>
      </section>

      <FamilySharingCard />

      <section className="settings-group">
        <h3>앱</h3>
        <button
          className="settings-row"
          type="button"
          disabled={!installPrompt || installed}
          onClick={async () => {
            if (!installPrompt) return;
            await installPrompt.prompt();
            const { outcome } = await installPrompt.userChoice;
            if (outcome === "accepted") setInstalled(true);
            setInstallPrompt(null);
          }}
        >
          <span className="settings-icon"><Download size={19} /></span>
          <span><strong>{installed ? "홈 화면에 설치됨" : "홈 화면에 앱 설치"}</strong><small>{installPrompt ? "앱처럼 빠르게 열 수 있어요" : "지원되는 브라우저에서 설치할 수 있어요"}</small></span>
        </button>
      </section>

      <section className="settings-group">
        <h3>계정과 데이터</h3>
        <div className="settings-row static-row">
          <span className="settings-icon"><ShieldCheck size={19} /></span>
          <span><strong>데이터 접근 보호</strong><small>우리 집 구성원만 공유 냉동실을 조회하고 수정할 수 있어요.</small></span>
        </div>
        <button className="settings-row danger-row" type="button" onClick={() => void clearData()}>
          <span className="settings-icon"><Trash2 size={19} /></span>
          <span><strong>모든 기록 삭제</strong><small>공유 냉동실과 내 장보기 목록을 모두 삭제합니다.</small></span>
        </button>
        <button className="settings-row" type="button" onClick={() => void logout()}>
          <span className="settings-icon"><LogOut size={19} /></span>
          <span><strong>로그아웃</strong><small>이 기기에서 카카오 연결을 종료합니다.</small></span>
        </button>
      </section>

      <p className="version-label">홈맘 0.1.0 · 냉동실 먼저</p>
    </main>
  );
}
