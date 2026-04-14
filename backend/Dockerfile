FROM node:20-slim

# ✅ Install system dependencies (clean + lightweight)
RUN apt-get update && \
    apt-get install -y yt-dlp ffmpeg && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# ✅ Set working directory
WORKDIR /app/backend

# ✅ Copy package files first (better caching)
COPY backend/package*.json ./

# ✅ Install dependencies
RUN npm install --omit=dev

# ✅ Copy remaining backend code
COPY backend/ .

# ✅ Ensure binaries are accessible
RUN which yt-dlp && which ffmpeg

# ✅ Start worker
CMD ["node", "src/workers/convert.worker.js"]