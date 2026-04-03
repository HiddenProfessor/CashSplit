FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN mkdir -p /app/data \
  && npx prisma generate \
  && npm run build

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

VOLUME ["/app/data"]

EXPOSE 3000

CMD ["sh", "-c", "node scripts/migrate.mjs && npm run start"]