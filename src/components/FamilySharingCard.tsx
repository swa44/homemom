"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, Home, LoaderCircle, UserPlus, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Household = {
  id: string;
  name: string;
  invite_code: string;
  owner_id: string;
};

type Member = {
  user_id: string;
  display_name: string;
  role: "owner" | "member";
  joined_at: string;
};

type MembershipRow = {
  household_id: string;
  role: "owner" | "member";
  homemom_households: Household | Household[] | null;
};

export function FamilySharingCard() {
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [household, setHousehold] = useState<Household>();
  const [members, setMembers] = useState<Member[]>([]);
  const [houseName, setHouseName] = useState("우리 집");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [setupRequired, setSetupRequired] = useState(false);

  const loadFamily = useCallback(async () => {
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error: membershipError } = await supabase
      .from("homemom_household_members")
      .select("household_id,role,homemom_households(id,name,invite_code,owner_id)")
      .eq("user_id", user.id)
      .maybeSingle();

    if (membershipError) {
      setSetupRequired(true);
      setLoading(false);
      return;
    }

    setSetupRequired(false);
    if (!data) {
      setHousehold(undefined);
      setMembers([]);
      setLoading(false);
      return;
    }

    const membership = data as unknown as MembershipRow;
    const related = Array.isArray(membership.homemom_households)
      ? membership.homemom_households[0]
      : membership.homemom_households;

    if (!related) {
      setError("우리 집 정보를 불러오지 못했어요.");
      setLoading(false);
      return;
    }

    const { data: memberRows, error: membersError } = await supabase
      .from("homemom_household_members")
      .select("user_id,display_name,role,joined_at")
      .eq("household_id", membership.household_id)
      .order("joined_at");

    setHousehold(related);
    setMembers((memberRows ?? []) as Member[]);
    if (membersError) setError("가족 구성원을 불러오지 못했어요.");
    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => void loadFamily());
  }, [loadFamily]);

  const createHousehold = async (event: React.FormEvent) => {
    event.preventDefault();
    setWorking(true);
    setError("");
    const supabase = createClient();
    const { error: createError } = await supabase.rpc("homemom_create_household", {
      requested_name: houseName.trim() || "우리 집",
    });
    if (createError) {
      setError("우리 집을 만들지 못했어요. 잠시 후 다시 시도해 주세요.");
      setWorking(false);
      return;
    }
    await loadFamily();
    setWorking(false);
  };

  const joinHousehold = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!inviteCode.trim()) return;
    setWorking(true);
    setError("");
    const supabase = createClient();
    const { error: joinError } = await supabase.rpc("homemom_join_household", {
      requested_code: inviteCode.trim().toUpperCase(),
    });
    if (joinError) {
      setError("초대 코드를 확인해 주세요. 이미 다른 우리 집에 참여 중일 수도 있어요.");
      setWorking(false);
      return;
    }
    await loadFamily();
    setWorking(false);
  };

  const copyInviteCode = async () => {
    if (!household) return;
    try {
      await navigator.clipboard.writeText(household.invite_code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setError("초대 코드를 복사하지 못했어요. 코드를 길게 눌러 복사해 주세요.");
    }
  };

  return (
    <section className="settings-group family-sharing-group">
      <h3>가족 공유</h3>

      {loading ? (
        <div className="family-loading"><LoaderCircle size={20} className="spin" /> 우리 집을 확인하는 중…</div>
      ) : setupRequired ? (
        <div className="family-setup-needed">
          <Home size={21} />
          <div><strong>가족 공유 설정이 필요해요</strong><p>SUPABASE_FAMILY_SHARING.sql을 먼저 실행해 주세요.</p></div>
        </div>
      ) : household ? (
        <div className="family-card">
          <div className="family-home-heading">
            <span className="settings-icon"><Home size={19} /></span>
            <div><strong>{household.name}</strong><small>냉동실 데이터를 함께 사용하고 있어요.</small></div>
            <span className="family-count"><Users size={13} /> {members.length}명</span>
          </div>

          <div className="invite-code-box">
            <span>가족 초대 코드</span>
            <div><strong>{household.invite_code}</strong><button type="button" onClick={() => void copyInviteCode()}>{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? "복사됨" : "복사"}</button></div>
            <small>가족이 자기 카카오 계정으로 로그인한 뒤 이 코드를 입력하면 됩니다.</small>
          </div>

          <div className="family-members">
            <span className="family-section-label">구성원</span>
            {members.map((member) => (
              <div className="family-member" key={member.user_id}>
                <span className="member-avatar">{member.display_name.trim().slice(0, 1) || "가"}</span>
                <strong>{member.display_name}</strong>
                <small>{member.role === "owner" ? "관리자" : "가족"}</small>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="family-onboarding">
          <div className="family-onboarding-copy">
            <span className="settings-icon"><Users size={20} /></span>
            <div><strong>가족과 냉동실 함께 보기</strong><p>각자 카카오 계정으로 로그인해도 같은 냉동실을 사용할 수 있어요.</p></div>
          </div>

          <form onSubmit={createHousehold} className="family-form">
            <label><span>새 우리 집 만들기</span><input value={houseName} maxLength={40} onChange={(event) => setHouseName(event.target.value)} placeholder="예: 우리 가족 냉동실" /></label>
            <button type="submit" disabled={working}><Home size={16} /> 만들기</button>
          </form>

          <div className="family-divider"><span>또는</span></div>

          <form onSubmit={joinHousehold} className="family-form">
            <label><span>가족 초대 코드로 참여</span><input value={inviteCode} maxLength={10} autoCapitalize="characters" onChange={(event) => setInviteCode(event.target.value.toUpperCase())} placeholder="초대 코드 10자리" /></label>
            <button type="submit" disabled={working || !inviteCode.trim()}><UserPlus size={16} /> 참여</button>
          </form>
        </div>
      )}

      {error ? <p className="family-error" role="alert">{error}</p> : null}
    </section>
  );
}
