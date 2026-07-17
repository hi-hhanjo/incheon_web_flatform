// 데이터 출처 표기 — 응원가 가사(PRD 9장 저작권)와 구단 정보(F-16~F-18) 양쪽에서 쓴다.
// 타이포는 BASE.md 4장 '미세 정보'(12px/400/1.5) 역할 그대로: 콘텐츠를 가리지 않는 최소 표기.
export default function SourceNote({
  label,
  name,
  url,
}: {
  label: string;
  name: string;
  url?: string;
}) {
  return (
    <p className="text-xs leading-normal text-text-muted">
      {label}:{" "}
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-text-secondary"
        >
          {name}
        </a>
      ) : (
        name
      )}
    </p>
  );
}
