FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npm run build

FROM node:20-alpine

RUN useradd -m -u 1000 user

USER user

ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

WORKDIR $HOME/app

COPY --from=builder --chown=user /app/dist ./dist
COPY --from=builder --chown=user /app/dist-server ./dist-server
COPY --from=builder --chown=user /app/public ./public

EXPOSE 7860

CMD ["node", "dist-server/server.js"]
