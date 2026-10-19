# ── Dependencies ────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ── Build ───────────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_PUBLIC_* vars are inlined at build time (used for SEO/canonical URLs).
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
# Free-shipping threshold in TND. A business number, so it belongs in the
# deployment config rather than the source; empty falls back to the app default.
ARG NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD
ENV NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD=$NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD
RUN npm run build

# ── Runtime ─────────────────────────────────────────────────
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.mjs ./next.config.mjs
EXPOSE 3000
CMD ["npm", "run", "start"]
