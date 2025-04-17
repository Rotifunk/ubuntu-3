# Dockerfile

# --- 의존성 설치 단계 (Dependencies Stage) ---
FROM node:20-alpine AS deps
WORKDIR /app

# package.json과 lock 파일을 먼저 복사하여 의존성 캐싱 활용
COPY package.json package-lock.json ./
RUN npm install --frozen-lockfile --production=false # 개발 의존성 포함 설치 (빌드에 필요할 수 있음)

# --- 빌드 단계 (Build Stage) ---
FROM node:20-alpine AS build
WORKDIR /app

# 이전 단계에서 설치한 node_modules 복사
COPY --from=deps /app/node_modules ./node_modules
# 나머지 소스 코드 복사
COPY . .

# 환경 변수 설정 (빌드 시 필요하다면)
# 예: ARG PUBLIC_API_URL
# ENV PUBLIC_API_URL=$PUBLIC_API_URL

# 애플리케이션 빌드
RUN npm run build

# 빌드 후 개발 의존성 제거 (선택 사항, 이미지 크기 약간 줄임)
RUN npm prune --production

# --- 최종 실행 단계 (Production Stage) ---
FROM node:20-alpine AS prod
WORKDIR /app

# 환경 변수 설정 (런타임 시 필요하다면)
# 예: ENV PORT=3000
# ENV NODE_ENV=production
ENV HOST=0.0.0.0 # 컨테이너 외부에서 접근 가능하도록 설정

# 빌드 단계에서 생성된 결과물만 복사
COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json

# 애플리케이션 실행 포트 노출
EXPOSE 3000 # 기본 SvelteKit 포트, 필요시 변경

# 애플리케이션 실행 명령어
CMD [ "node", "build" ]
