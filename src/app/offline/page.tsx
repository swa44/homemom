import Link from "next/link";
import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <main className="offline-page">
      <span className="empty-icon"><WifiOff size={28} /></span>
      <h1>인터넷 연결이 없어요</h1>
      <p>연결 상태를 확인한 뒤 다시 시도해 주세요.</p>
      <Link className="primary-button" href="/">다시 확인하기</Link>
    </main>
  );
}
