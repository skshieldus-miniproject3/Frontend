# Mock 서버 사용 가이드

## 🚀 Mock 서버 설정

### 1. 환경변수 설정
프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```bash
# Mock 서버 사용 설정
NEXT_PUBLIC_USE_MOCK=true

# 실제 서버 URL (Mock 사용 안할 때)
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

### 2. Mock 서버 ↔ 실제 서버 전환

#### Mock 서버 사용 (개발/테스트)
```bash
NEXT_PUBLIC_USE_MOCK=true
```

#### 실제 서버 사용 (프로덕션)
```bash
NEXT_PUBLIC_USE_MOCK=false
```

## 🎯 Mock 서버 기능

### ✅ 지원하는 API
- **인증**: 회원가입, 로그인, 로그아웃, 내 정보 조회, 닉네임 중복 확인
- **회의록**: 목록 조회, 생성, 상세 조회, 수정, 삭제
- **AI 분석**: 분석 요청 (시뮬레이션)

### 🔄 자동 시뮬레이션
1. **회의 생성** → `uploaded` 상태
2. **3초 후** → `processing` 상태로 변경
3. **10초 후** → `completed` 상태로 변경 (AI 분석 완료)

### 🧪 테스트 계정
- **이메일**: `test@example.com`
- **비밀번호**: `password123`

## 🔧 사용법

### Mock 서버로 시작
```bash
npm run dev
# .env.local에서 NEXT_PUBLIC_USE_MOCK=true 설정
```

### 실제 서버로 전환
```bash
# .env.local에서 NEXT_PUBLIC_USE_MOCK=false 설정
# 또는 환경변수 제거 (기본값: false)
```

## 📝 Mock 데이터 특징

- **메모리 저장**: 새로고침 시 데이터 초기화
- **실시간 시뮬레이션**: AI 분석 과정을 단계별로 시뮬레이션
- **완전한 API 호환**: 실제 서버와 동일한 응답 구조
- **에러 처리**: 실제 서버와 동일한 에러 응답

## 🎨 개발 워크플로우

1. **Mock 서버로 개발** → 빠른 프로토타이핑
2. **실제 서버로 테스트** → 실제 API 연동 확인
3. **프로덕션 배포** → Mock 서버 비활성화

