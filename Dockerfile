# 인천 유나이티드 응원가 웹 — 로컬 개발환경 컨테이너 (TECHSTACK.md 2.9)
#
# 이 이미지는 "배포용"이 아니라, 배포 전 "어디서나 똑같이 도는지" 확인하는 로컬 검증용입니다.
# 실제 배포는 Vercel이 Next.js를 자체 빌드해서 합니다(2.5). 이 이미지는 Vercel에 올라가지 않습니다.
#
# 사용법:
#   docker build -t incheon-chant .
#   docker run -p 3000:3000 incheon-chant
#   → 브라우저에서 http://localhost:3000 확인
#
# 단계를 나눈 이유: 의존성 설치 → 빌드 → 실행을 분리하면, 코드만 바뀌었을 때
# 의존성 설치 단계를 다시 하지 않고 캐시를 재사용해 빌드가 빨라집니다.

# 1) 의존성 설치 단계 ----------------------------------------------------------
FROM node:22-slim AS deps
WORKDIR /app
# package.json / lock 파일만 먼저 복사해, 소스가 바뀌어도 의존성 캐시가 유지되게 합니다.
COPY package.json package-lock.json ./
RUN npm ci

# 2) 빌드 단계 ----------------------------------------------------------------
FROM node:22-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# next build → .next/ 결과물 생성
RUN npm run build

# 3) 실행 단계 ----------------------------------------------------------------
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
# next start에 필요한 것만 이전 단계에서 복사합니다.
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts
EXPOSE 3000
# npm run start === next start (package.json scripts)
CMD ["npm", "run", "start"]
