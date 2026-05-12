FROM node:22-slim AS base

FROM base AS build

WORKDIR /app

RUN corepack enable
COPY ./package.json ./pnpm-lock.yaml ./pnpm-workspace.yaml ./.npmrc ./

COPY ./turbo.json ./.eslintrc.js ./.lighthouserc.js ./
COPY ./apps/ ./apps/
COPY ./packages/ ./packages/

ARG NEXT_PUBLIC_SALEOR_API_URL
ENV NEXT_PUBLIC_SALEOR_API_URL=${NEXT_PUBLIC_SALEOR_API_URL}

ARG NEXT_PUBLIC_DEFAULT_CHANNEL
ENV NEXT_PUBLIC_DEFAULT_CHANNEL=${NEXT_PUBLIC_DEFAULT_CHANNEL}

ARG NEXT_PUBLIC_STRIPE_PUBLIC_KEY
ENV NEXT_PUBLIC_STRIPE_PUBLIC_KEY=${NEXT_PUBLIC_STRIPE_PUBLIC_KEY}

ENV NEXT_TELEMETRY_DISABLED=1
ENV TURBO_TELEMETRY_DISABLED=1

# Installs late due to needing --recursive flag
ENV PNPM_HOME="/pnpm"
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm i --recursive --frozen-lockfile

# Env vars SALEOR_APP_TOKEN and STRIPE_SECRET_KEY are required env vars but not
# used during build. Instead they can be set directly at runtime in the server.
# As these are secrets we are not passing them in the build.
RUN \
  SALEOR_APP_TOKEN= \
  STRIPE_SECRET_KEY= \
  NEXT_OUTPUT=standalone \
  pnpm run build:storefront

FROM base AS final

WORKDIR /app
COPY --from=build /app/apps/storefront/.next/standalone/ ./
COPY --from=build /app/apps/storefront/.next/static ./apps/storefront/.next/static

CMD ["node", "/app/apps/storefront/server.js"]
