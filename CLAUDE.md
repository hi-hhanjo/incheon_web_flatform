# CLAUDE.md — 인천 유나이티드 응원가 웹페이지

이 프로젝트의 규칙은 [`.agent/rules.md`](.agent/rules.md)에 있습니다. 아래 import로 불러옵니다.

@.agent/rules.md

---

## 이 파일이 이렇게 생긴 이유 (2026-07-17 정리)

- **일반 코딩 지침**(Karpathy 4원칙 — 생각 먼저, 단순하게, 외과수술적 변경, 목표 기반 실행)은
  **상위 폴더 `../CLAUDE.md`** 에 있고 이 디렉터리에도 자동 적용됩니다. 예전엔 그 내용을 이 파일에
  **글자 그대로 복제**해 두 곳이 같은 텍스트를 갖고 있었는데(md5 동일), 한쪽만 고치면 갈라지는
  구조라 복제를 걷어냈습니다.
- 대신 이 파일은 **프로젝트 고유 규칙**(`.agent/rules.md`)을 연결하는 역할만 합니다.
  `.agent/rules.md`는 "AI 코딩 도구는 작업 전에 이 파일을 먼저 읽습니다"라고 선언해 놓고도
  **실제로는 어떤 도구도 읽지 않는 상태**였습니다 — 위 import가 그 구멍을 막습니다.

## 문서 지도

무엇을 고치기 전에 근거 문서를 먼저 봅니다(`.agent/rules.md` 1장).

| 알고 싶은 것 | 문서 |
|---|---|
| 무엇을/왜 만드는가, 범위·Non-Goals, 저작권 방침 | `docs/bible/PRD.md` |
| 각 기능이 화면에서 어떻게 동작하는가 | `docs/bible/FUNCTION.md` |
| 어떤 기술로 만드는가, 폴더 구조 | `docs/bible/TECHSTACK.md` |
| 색·글꼴·간격 토큰 | `docs/design/BASE.md` |
| 각 화면 부품의 상세 | `docs/design/README.md` → `docs/design/components/*.md` |
| 데이터 모델·API 계약 | `docs/data/API_SPEC.md`, `docs/data/ERD_SPEC.md`, `docs/data/CLUB_ERD_SPEC.md` |
| 데이터를 어디서 어떻게 긁어오는가 | `docs/data/CRAWLER_SPEC.md` |
