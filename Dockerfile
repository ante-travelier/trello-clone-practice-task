# Reproducible devbox for autonomous agent runs.
FROM node:20-bookworm

# Tools the harness expects natively.
RUN apt-get update && apt-get install -y --no-install-recommends \
      git ca-certificates postgresql-client \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace
COPY . .

# Install all workspaces + Playwright browsers with system deps.
RUN npm install \
 && npm run install:all \
 && cd server && npx prisma generate && cd .. \
 && npm --prefix e2e exec -- playwright install --with-deps chromium

CMD ["bash"]
