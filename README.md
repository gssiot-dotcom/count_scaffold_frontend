# GSS Role-based Web UI

## 실행 방법

```bash
cd gss-role-web
npm install
npm run dev
```

브라우저: http://localhost:5173

## 권한 구조

- `src/roles/superAdmin` : Super Admin - GSS
- `src/roles/siteWorker` : 현장 직원
- `src/roles/siteManager` : 현장 총책임자
- `src/roles/officeWorker` : 사무실 직원
- `src/roles/officeManager` : 사무실 총책임자

## 핵심 구조

- `src/data/roleConfig.js`에서 권한별 메뉴와 접근 페이지를 관리합니다.
- `Topbar` 우측 select로 권한을 바꿔 화면 확인이 가능합니다.
- 실제 로그인 연동 시에는 `role` 값을 API 로그인 결과로 교체하면 됩니다.
