# Development image only; v1 is not deployed anywhere.
FROM node:20

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 4200
# --poll: file events don't cross Docker Desktop bind mounts on Windows/macOS.
CMD ["npx", "ng", "serve", "--host", "0.0.0.0", "--poll", "1000"]
