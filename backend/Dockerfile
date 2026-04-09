FROM node:20-slim

# Install dependencies
RUN apt-get update && apt-get install -y \
    yt-dlp \
    ffmpeg

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

CMD ["node", "src/workers/convert.worker.js"]