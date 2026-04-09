FROM node:20-slim

# Install system deps
RUN apt-get update && apt-get install -y yt-dlp ffmpeg

# IMPORTANT: move into backend folder
WORKDIR /app/backend

# Copy ONLY backend files
COPY backend/package*.json ./

RUN npm install

COPY backend/ .

CMD ["node", "src/workers/convert.worker.js"]