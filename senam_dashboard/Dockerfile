# ─── Stage 1: deps ────────────────────────────────────────────────────────────
# Vite 8 requires Node >= 20.19 / 22.12 — use Node 22 to be safe.
FROM node:22-alpine AS deps
WORKDIR /app
# .npmrc carries `legacy-peer-deps=true`, required for `npm ci` to resolve
# (typescript 6 vs openapi-typescript's typescript@^5 peer range).
COPY package.json package-lock.json .npmrc ./
RUN npm ci

# ─── Stage 2: development (hot reload, used by docker-compose.dev.yml) ─────────
FROM deps AS development
WORKDIR /app
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]

# ─── Stage 3: build (static assets) ───────────────────────────────────────────
FROM deps AS build
WORKDIR /app
# Vite inlines VITE_* env vars at BUILD time, so they must be present here.
ARG VITE_API_BASE_URL=""
ARG VITE_WS_URL=""
ARG VITE_DEFAULT_LOCALE=en
ARG VITE_DEFAULT_TZ=Asia/Qatar
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_WS_URL=$VITE_WS_URL \
    VITE_DEFAULT_LOCALE=$VITE_DEFAULT_LOCALE \
    VITE_DEFAULT_TZ=$VITE_DEFAULT_TZ
COPY . .
RUN npm run build

# ─── Stage 4: production (nginx serves SPA + reverse-proxies the API) ──────────
FROM nginx:alpine AS production
# SPA fallback + /v1, /healthz, /swagger, /socket.io reverse proxy to `api`.
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost/ >/dev/null 2>&1 || exit 1
CMD ["nginx", "-g", "daemon off;"]
