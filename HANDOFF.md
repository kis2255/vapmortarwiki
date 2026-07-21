---
slug: vapmortarwiki (미매핑 — pi-team 프로젝트 폴더 없음)
date: 2026-07-21
session: "서버통합 1단계 — nginx /soc 적용 + 통합가이드 작성"
author: icksung.kwon1 (권익성)
---

# HANDOFF — 특수몰탈 기술위키 × 영업기회 SOC 통합

> 인수자용 스냅샷 (항상 최신 상태만 유지 — 누적 아님).
> 전체 설계·절차의 정본은 **[docs/서버통합가이드.md](docs/서버통합가이드.md)** — 이 문서는 요약과 진행 상태만 담는다.

## 현재 상태

- **두 앱은 같은 서버(10.50.20.51)에서 운영 중** — 위키 `vapmortarwiki-app`(8003, healthy) + SOC `soc-mortar-app`(8013, healthy). 서버 이전 작업 없음.
- **통합 방향 확정 (2026-07-21)**: ① 단일 도메인 `vapm.sampyo.co.kr` + `/soc` 경로 라우팅 ② **디자인은 SOC 기준으로 위키를 통일** ③ 데이터 연계는 그 다음. 완전 앱 병합은 비권장 (근거: 가이드 §6).
- **1단계 진행률**: nginx 서버 적용 **완료** — `https://vapm.sampyo.co.kr/soc/health` → 200, 위키 무영향 확인. SOC 앱 측 `root_path` 반영이 안 되어 `/soc/` 로그인 리다이렉트가 `/login`으로 새는 상태 (예상된 동작, SOC 수정 대기). 기존 `10.50.20.51:8013` 직접 접속은 병행 유지 중이라 서비스 영향 없음.
- 부수 수정: 위키 앱 헬스체크 오탐(localhost→127.0.0.1) 해소 — 컨테이너 healthy 전환 완료.

## 오늘 한 일 (2026-07-21)

- 위키 헬스체크 오탐 수정·재배포 — 커밋 `0422fae`, 서버 반영, healthy 확인. deploy-standard §11 완료 처리(`e9e610d`, `docs/migrate-deploy-procedure` 브랜치 push 완료)
- `docs/서버통합가이드.md` 작성 — 커밋 `415fb57`(초판) → `f4f2f92`(경로 라우팅 확정 + 디자인 통합 단계 추가)
- **서버 nginx에 `/soc` location 적용** — vapm vhost 수정, 백업 `/etc/nginx/sites-available/vapm.sampyo.co.kr.bak-20260721`
- SOC 디자인 체계 실측 (`soc-app/webapp/app/templates/base.html`) → 가이드 §3.1에 토큰 정리

## 다음 첫 행동

1. **[SOC 측 — kkj8880 요청]** mortar-soc에 `root_path=/soc` 반영: uvicorn `--root-path /soc` + 템플릿 절대경로(`/static`, 로그인 리다이렉트) 전수 점검 + `webapp.env`의 `SESSION_COOKIE_SECURE=true` + 카카오 개발자콘솔 허용 도메인에 `vapm.sampyo.co.kr` 추가. 상세: 가이드 §2.2-2·3
2. **[위키 측]** 디자인 통합 구현: `globals.css` `@theme`에 SOC 토큰(#003876, #0f172a, #f1f5f9, 카드 #e8ecf0/14px) 이식 → Pretendard(`next/font/local`) → `src/components/layout/sidebar.tsx`를 SOC 레이아웃(다크 사이드바 220px + 네이비 그라데이션 탑바 56px)으로 개편. 상세: 가이드 §3.2
3. **[양측]** 상호 네비게이션 링크: 위키 사이드바 → `/soc/`, SOC 메뉴 → `/` (1번 완료 후)

## 핵심 명령·링크

```bash
# 서버 접속 (비밀번호: 사내 vault / scripts/deploy_PROD.py 참조)
ssh sampyopi@10.50.20.51

# 상태 확인
docker ps --format '{{.Names}}\t{{.Status}}' | grep -E 'vapm|soc'
curl -sk -o /dev/null -w '%{http_code}\n' https://vapm.sampyo.co.kr/soc/health   # 200 기대

# 위키 재배포 (로컬에서)
git push origin main && git push github main   # ⚠ 반드시 양쪽 push (아래 '잊지 말 것')
python3 scripts/deploy_PROD.py
```

- 통합 설계 정본: [docs/서버통합가이드.md](docs/서버통합가이드.md)
- 배포 표준: `~/projects/deploy-standard/docs/00-공통표준.md` · `20-앱서버-10.50.md`
- 저장소: 위키 = Gitea `SampyoOps/vapmortarwiki` + GitHub `kis2255/vapmortarwiki` / SOC = Gitea `kkj8880/mortar-soc`
- 서버 배포 경로: 위키 `/home/sampyopi/vapmortarwiki` / SOC `/home/sampyopi/soc-app`

## 잊지 말 것

- **위키 push는 양쪽 모두**: 로컬 origin은 Gitea지만 **서버는 GitHub에서 pull** — GitHub 누락 시 배포 안 됨. (원격 일원화 미결)
- **보안**: 서버 저장소 remote URL에 GitHub PAT가 평문 삽입돼 있음 — **토큰 재발급 권고** (미조치). 재발급 시 credential helper 또는 Gitea 전환 검토.
- nginx 롤백: `.bak-20260721` 복원 → `nginx -t` → reload. SOC는 8013 직접 접속으로 무중단.
- SOC 데이터 갱신 스케줄러가 **04:30 KST(발주)·월 05:00(신축)** 에 돎 — 그 시간대 SOC 재배포 회피.
- pi-team 거버넌스 매핑 없음(vapmortarwiki·mortar-soc 둘 다) — 필요 시 `/map-asana`로 생성.
