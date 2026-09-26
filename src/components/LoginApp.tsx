"use client";

import { useState } from "react";
import { Search, Snowflake } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function LoginApp({ hasError }: { hasError: boolean }) {
  const [loading, setLoading] = useState(false);

  const login = async () => {
    setLoading(true);
    const supabase = createClient();
    const next = new URLSearchParams(window.location.search).get("next") ?? "/";
    const redirectTo = new URL("/auth/callback", window.location.origin);
    redirectTo.searchParams.set("next", next);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: { redirectTo: redirectTo.toString() },
    });
    if (error) setLoading(false);
  };

  return (
    <main className="login-page">
      <div className="login-visual" aria-hidden="true">
        <span className="login-snow large"><Snowflake /></span>
        <span className="login-snow small"><Snowflake /></span>
        <div className="freezer-card">
          <div className="freezer-door"><span /><span /><span /></div>
          <div className="freezer-search"><Search size={15} /> 만두는 오른쪽 1칸</div>
        </div>
      </div>
      <div className="login-copy">
        <p className="section-kicker">두 냉동실을 한눈에</p>
        <h1>찾느라 문 열어두지 말고,<br /><strong>홈맘</strong>에게 물어보세요.</h1>
        <p>어디에 무엇이 있는지 기록하고<br />이름만 검색해서 바로 찾아요.</p>
      </div>
      {hasError ? <p className="login-error" role="alert">로그인을 완료하지 못했어요. 다시 시도해 주세요.</p> : null}
      <button className="kakao-button" type="button" onClick={login} disabled={loading}>
        <span aria-hidden="true">●</span>
        {loading ? "카카오로 이동 중…" : "카카오로 시작하기"}
      </button>
      <p className="login-footnote">개인 냉동실 기록은 로그인한 계정에만 저장됩니다.</p>
    </main>
  );
}
