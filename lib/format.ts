// 주간 갱신 스냅샷 데이터(순위표·경기)의 "기준일" 라벨. 사용자 접속일이 아니라
// 데이터가 수집·반영된 날(updatedAt)을 한국 시간 기준으로 "2026년 7월 16일 기준"처럼 표시한다.
export function snapshotLabel(updatedAt: string | null): string {
  if (!updatedAt) return "예시 데이터";
  const formatted = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(updatedAt));
  return `${formatted} 기준`;
}
