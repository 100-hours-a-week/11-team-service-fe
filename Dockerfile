ARG NODE_VERSION=22.22

FROM node:${NODE_VERSION}-alpine as base

WORKDIR /app

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs && \
    chown -R nodejs:nodejs /app

#================================
# 의존성 설치 스테이지
#================================
FROM base as deps

COPY package*.json ./

RUN --mount=type=cache,target=/root/.npm,sharing=locked \
    npm ci --omit=dev && \
    npm cache clean --force

RUN chown -R nodejs:nodejs /app

#================================
# 정적 파일으로의 빌드를 위한 의존성 설치
#================================ 
FROM base AS build-deps

COPY package*.json ./

RUN --mount=type=cache,target=/root/.npm,sharing=locked \
    npm ci --no-audit --no-fund && \
    npm cache clean --force

RUN mkdir -p /app/node_modules/.vite && \
    chown -R nodejs:nodejs /app

#================================
# 정적 파일 빌드 스테이지
#================================
FROM build-deps AS build

COPY --chown=nodejs:nodejs . .

RUN npm run build

RUN chown -R nodejs:nodejs /app

#================================
# 개발 스테이지
#================================
FROM build-deps AS development

ENV NODE_ENV=development

COPY . .

RUN mkdir -p /app/node_modules/.vite && \
    chown -R nodejs:nodejs /app && \
    chmod -R 755 /app

USER nodejs

EXPOSE 3000

CMD ["npm", "run", "dev"]

#================================
# 프로덕션 스테이지
#================================
FROM nginx:alpine AS production

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
