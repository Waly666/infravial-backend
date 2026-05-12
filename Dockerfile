FROM node:20-alpine
WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./

RUN pnpm install --prod --frozen-lockfile

COPY . .

EXPOSE 3000
CMD ["node", "server.js"]
