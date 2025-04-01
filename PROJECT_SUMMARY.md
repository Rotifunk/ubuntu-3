# 프로젝트 상세 요약: ChatGPT UI 클론 (SvelteKit)

## 1. 프로젝트 개요

이 프로젝트는 ChatGPT 웹 인터페이스의 프론트엔드 UI를 클론 코딩하는 것을 목표로 진행되었습니다. 사용자 경험과 데이터 관리 측면을 고려하여 단계적으로 기능을 확장하고 개선했습니다. 최종적으로 SvelteKit, TypeScript, Tailwind CSS를 기반으로 SQLite 데이터베이스 연동, Google Gemini LLM 연동 (스트리밍 포함), Markdown 렌더링 등 다양한 기능을 갖춘 웹 애플리케이션을 구축했습니다.

## 2. 사용된 주요 기술 스택

*   **프레임워크:** SvelteKit (Vite 기반) - 최신 웹 표준과 빠른 개발 경험 제공.
*   **언어:** TypeScript - 정적 타입 검사를 통한 코드 안정성 및 유지보수성 향상.
*   **스타일링:** Tailwind CSS - 유틸리티 우선 접근 방식으로 빠르고 일관된 UI 개발.
    *   `@tailwindcss/typography`: Markdown 콘텐츠 스타일링 지원.
    *   `@tailwindcss/forms`: (설치됨, 필요시 사용 가능)
*   **상태 관리:** Svelte Stores - 컴포넌트 간 상태 공유 및 반응성 관리를 위한 내장 솔루션.
*   **데이터베이스:** SQLite - 별도 서버 없이 파일 기반으로 데이터를 관리하여 개인용 및 컨테이너 환경에 적합.
*   **ORM:** Drizzle ORM - TypeScript 기반의 SQL 쿼리 빌더 및 ORM으로 타입 안전성 제공.
*   **LLM:** Google Gemini API (@google/generative-ai SDK) - 실제 대화형 AI 기능 구현.
*   **Markdown 파싱:** `marked` - 메시지 콘텐츠의 Markdown 문법을 HTML로 변환.
*   **ID 생성:** `nanoid` - 고유한 채팅 세션 ID 생성.
*   **환경 관리:** Node Version Manager (nvm), npm - 개발 환경 구성 및 패키지 관리.

## 3. 구현된 주요 기능 및 상세 과정

### 3.1. 초기 설정 및 기본 UI 구축
*   **프로젝트 생성:** `npm create vite@latest`를 사용하여 SvelteKit + TypeScript 템플릿으로 프로젝트를 시작했습니다.
*   **환경 설정:** 개발에 필요한 nvm, Node.js, npm을 설치했습니다.
*   **Tailwind CSS 설정:** Tailwind CSS 및 관련 플러그인(`@tailwindcss/typography`, `@tailwindcss/forms`)을 설치하고, 누락되었던 `tailwind.config.ts` 설정 파일을 생성하여 플러그인을 활성화했습니다.
*   **기본 레이아웃:** `src/routes/+layout.svelte` 파일을 수정하여 ChatGPT와 유사한 2단 구조(사이드바, 메인 영역)의 기본 레이아웃을 Tailwind CSS 클래스를 이용해 구성했습니다.
*   **핵심 컴포넌트 생성:** 재사용성을 위해 주요 UI 영역을 별도의 Svelte 컴포넌트로 분리했습니다:
    *   `Sidebar.svelte`: 채팅 목록 표시 및 관리 (추가, 선택, 편집, 삭제).
    *   `ChatArea.svelte`: 메시지 목록 및 입력 필드를 포함하는 메인 채팅 영역.
    *   `InputField.svelte`: 사용자 메시지 입력 및 전송 처리 (`textarea` 사용).
    *   `MessageBubble.svelte`: 사용자/봇 메시지를 구분하여 표시.

### 3.2. 상태 관리 및 데이터 영속성 구현
*   **초기 상태 관리:** Svelte Stores (`src/lib/stores/chatStore.ts`)를 도입하여 채팅 세션 목록(`chatSessions`), 현재 선택된 채팅 ID(`selectedChatId`), 현재 채팅 메시지 목록(`currentChatMessages`) 등의 상태를 관리했습니다.
*   **localStorage 기반 영속성:** 초기에는 브라우저의 `localStorage`를 사용하여 채팅 데이터(세션, 메시지)를 저장하고 로드하여 새로고침 시에도 데이터가 유지되도록 구현했습니다.
*   **데이터베이스 전환 결정:** `localStorage`의 데이터 유실 가능성과 확장성 한계를 고려하여, 컨테이너 환경에서의 영속성을 위해 SQLite 데이터베이스와 볼륨 마운트 방식을 사용하기로 결정했습니다.
*   **SQLite 및 Drizzle 설정:**
    *   Drizzle ORM 스키마(`src/lib/server/db/schema.ts`)에 `chat_session`과 `message` 테이블 구조를 정의했습니다. (메시지 삭제 시 연관 데이터 자동 삭제를 위한 `onDelete: 'cascade'` 설정 포함)
    *   `.env` 파일에 SQLite 데이터베이스 파일 경로(`DATABASE_URL=file:./sqlite.db`)를 설정했습니다. (`@libsql/client` 호환 형식 사용)
    *   Drizzle Kit 마이그레이션 (`npm run db:migrate`, `npm run db:push`)을 실행하여 `sqlite.db` 파일 및 테이블을 생성했습니다.
*   **서버 API 기반 데이터 처리:**
    *   데이터 CRUD(Create, Read, Update, Delete) 로직을 SvelteKit 서버 API 라우트로 이전했습니다 (`src/routes/api/...`). 각 라우트는 Drizzle ORM을 사용하여 데이터베이스와 상호작용합니다.
    *   클라이언트 측 스토어 함수(`...Client`)는 이제 `fetch`를 사용하여 해당 서버 API를 호출하도록 수정되었습니다.
    *   `localStorage` 관련 로직은 스토어에서 제거되었습니다.
    *   레이아웃 로드 함수(`+layout.server.ts`)를 사용하여 초기 채팅 목록을 서버에서 직접 로드하도록 변경했습니다.
*   **Optimistic UI 업데이트:** 사용자 경험 향상을 위해 메시지 추가, 채팅 삭제/편집 시 서버 응답을 기다리지 않고 UI를 먼저 업데이트한 후, 서버 응답에 따라 상태를 확정하거나 되돌리는 방식을 적용했습니다.

### 3.3. LLM 연동 (Google Gemini)
*   **API 설정:** `@google/generative-ai` SDK를 설치하고, Gemini API 키를 `.env` 파일에 환경 변수(`GEMINI_API_KEY`)로 설정했습니다.
*   **Gemini API 라우트:** 사용자 메시지와 대화 기록을 받아 Gemini API(`gemini-2.5-pro-exp-03-25` 모델 사용)를 호출하는 서버 API 라우트(`POST /api/chats/[chatId]/gemini`)를 생성했습니다.
*   **스트리밍 응답 구현:**
    *   Gemini API의 `sendMessageStream` 메서드를 사용하여 응답을 스트림으로 받도록 수정했습니다.
    *   서버 API 라우트는 받은 스트림을 SvelteKit의 `ReadableStream`을 통해 클라이언트로 실시간 전송합니다.
    *   클라이언트(`getBotResponseClient`)는 스트림을 읽어 `currentChatMessages` 스토어를 점진적으로 업데이트하여 화면에 실시간으로 텍스트가 표시되도록 구현했습니다.
    *   스트리밍 완료 후, 완성된 봇 메시지를 DB에 저장하기 위해 클라이언트가 메시지 저장 API(`POST /api/chats/[chatId]/messages`)를 다시 호출합니다.

### 3.4. Markdown 렌더링
*   **라이브러리 설치:** `marked` 라이브러리를 설치했습니다.
*   **컴포넌트 수정:** `MessageBubble.svelte` 컴포넌트에서 `marked.parse()`를 사용하여 `content` prop의 Markdown 텍스트를 HTML로 변환하고, `{@html ...}` 태그를 사용하여 렌더링하도록 수정했습니다.
*   **스타일링:** `@tailwindcss/typography` 플러그인을 활성화하고 `prose prose-sm prose-invert` 클래스를 적용하여 코드 블록, 목록 등 Markdown 요소에 기본 스타일을 적용했습니다. 추가적인 커스텀 스타일도 `<style>` 블록에 정의했습니다.

### 3.5. UI/UX 개선 사항
*   **선택 항목 강조:** 사이드바에서 현재 선택된 채팅 항목의 배경색을 다르게 표시합니다.
*   **자동 스크롤:** 새 메시지 추가 시 채팅 영역이 부드럽게(`scroll-smooth`, `scrollIntoView`) 맨 아래로 스크롤됩니다. 사용자가 직접 스크롤하면 자동 스크롤이 일시 중지됩니다.
*   **입력 필드 자동 높이 조절:** 메시지 입력 필드(`textarea`)가 내용 길이에 따라 자동으로 높이가 조절됩니다 (최대 높이 제한 포함).
*   **로딩 표시:** 봇 응답 대기 중 "Bot is typing..." 표시기가 나타납니다.
*   **자동 포커스:** 채팅 세션 선택 시 메시지 입력 필드에 자동으로 포커스가 이동합니다.

### 3.6. 디버깅 및 문제 해결 과정
프로젝트 진행 중 다양한 문제에 직면했으며, 다음과 같은 과정을 통해 해결했습니다:
*   **Svelte 5 문법 오류:** 룬 모드 도입에 따른 `$effect` 사용, 이벤트 핸들러 문법 변경(`on:click` -> `onclick`), 컴파일러/린터와의 호환성 문제 등을 디버깅하고 수정했습니다.
*   **도구 오류:** `replace_in_file` 도구의 SEARCH 블록 불일치 문제를 여러 번 겪었으며, `write_to_file`을 대체 수단으로 사용하거나 SEARCH 블록을 더 정확하게 수정하여 해결했습니다.
*   **데이터 흐름 문제:** 메시지 미표시, 봇 응답 중복 등의 문제를 해결하기 위해 콘솔 로그를 추가하여 데이터 흐름과 함수 호출 순서를 추적하고, 상태 관리 로직(스토어 업데이트, props 전달, API 호출 순서)을 수정했습니다.
*   **환경 설정 오류:** SQLite 클라이언트 URL 형식 오류, Tailwind 설정 파일 누락 등의 문제를 해결했습니다.

## 4. 최종 결과

현재 애플리케이션은 ChatGPT의 핵심적인 UI/UX를 모방하며, 실제 LLM과 연동하여 대화하고 그 기록을 데이터베이스에 영구적으로 저장하는 기능을 갖춘 클론 프로젝트입니다. 스트리밍, Markdown 렌더링 등 사용자 경험을 향상시키는 기능들도 포함되었습니다.
