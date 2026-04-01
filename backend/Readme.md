# 🎧 Video to MP3 Converter (Full Backend System)

A scalable backend service that converts video URLs (YouTube, Instagram, Twitter, etc.) into downloadable MP3 files with metadata preview support.

---

## 🚀 Features

* 🔗 Accept video URLs from multiple platforms
* 🎬 Extract metadata (title, thumbnail, duration, uploader)
* 🎧 Convert video → MP3 using `yt-dlp`
* ⚡ Queue-based processing using **BullMQ + Redis**
* ☁️ Upload audio files to **ImageKit CDN**
* 🗄️ Store job status in **MongoDB**
* 🔄 Polling-based status tracking API
* 🧠 Smart URL normalization (YouTube Shorts → Watch URL)

---

## 🏗️ Tech Stack

* **Backend:** Node.js, Express
* **Queue:** BullMQ + Redis
* **Database:** MongoDB (Mongoose)
* **Media Processing:** yt-dlp + FFmpeg
* **Storage:** ImageKit

---

## 📁 Project Structure

```id="projstruct1"
backend/
│── downloads/                # Temporary audio storage
│── src/
│   │── controllers/         # API logic (convert, status)
│   │── services/            # Conversion logic (yt-dlp, upload)
│   │── workers/             # BullMQ worker
│   │── routes/              # API routes
│   │── models/              # MongoDB schemas
│   │── config/              # DB, queue, ImageKit config
│   │── utils/               # 🔥 Metadata + helpers
│   │      └── metaData.js   # yt-dlp metadata extraction
│   │── app.js
│   │── server.js
│── package.json
│── .env
```

---

## 🧠 How It Works

```id="flow1"
User → POST /convert
      ↓
Controller
      ↓
Metadata fetched (utils/metaData.js)
      ↓
Job saved in MongoDB
      ↓
Job added to Queue (Redis)
      ↓
Worker processes job
      ↓
yt-dlp converts video → MP3
      ↓
File uploaded to ImageKit
      ↓
MongoDB updated (fileUrl)
      ↓
Frontend polls GET /convert/:id
```

---

## ⚙️ Installation

### 1. Clone Repository

```id="clone1"
git clone <your-repo-url>
cd backend
```

### 2. Install Dependencies

```id="install1"
npm install
```

---

## 🐳 Run Redis (Docker)

```id="redis1"
docker run -d -p 6379:6379 --name redis-server redis
```

---

## 🔐 Environment Variables

Create `.env` file:

```id="env1"
PORT=5000
MONGO_URI=your_mongodb_url

IMAGEKIT_PUBLIC_KEY=your_key
IMAGEKIT_PRIVATE_KEY=your_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id
```

---

## ▶️ Run Application

### Start Backend

```id="run1"
npm run dev
```

### Start Worker (IMPORTANT)

```id="worker1"
node src/workers/convert.worker.js
```

---

## 📡 API Endpoints

### 🔹 Convert Video

**POST** `/api/convert`

```json id="req1"
{
  "url": "https://youtube.com/..."
}
```

**Response:**

```json id="res1"
{
  "id": "123",
  "status": "pending",
  "title": "Video Title",
  "thumbnail": "image_url",
  "duration": 200
}
```

---

### 🔹 Get Status

**GET** `/api/convert/:id`

```json id="res2"
{
  "status": "completed",
  "fileUrl": "https://cdn-link.mp3",
  "error": null
}
```

---

## 🧩 Key Components

### 🔹 Controllers

* Handle request/response
* Normalize URLs
* Detect platform
* Fetch metadata

---

### 🔹 Services

* Handle video processing
* Convert using `yt-dlp`
* Upload to ImageKit

---

### 🔹 Utils (`src/utils`)

* Extract metadata using:

```bash id="cmd1"
yt-dlp -j <url>
```

* Returns:

  * title
  * thumbnail
  * duration
  * uploader

---

### 🔹 Queue (BullMQ)

* Handles background jobs
* Prevents blocking API
* Scales easily

---

### 🔹 Worker

* Listens to queue
* Runs conversion logic
* Updates DB

---

## ⚠️ Common Issues & Fixes

### ❌ Download button not working

* Ensure frontend reads `fileUrl`
* Use:

```id="dlfix1"
href={`${fileUrl}?ik-attachment=true`}
```

---

### ❌ Metadata not showing

* Ensure `getVideoMetadata` is called
* Check yt-dlp installed

---

### ❌ Redis not connecting

* Ensure Docker container is running

---

## 🚀 Future Improvements

* 🎨 React Frontend UI
* 📊 Real-time progress tracking
* 🔐 Authentication (JWT)
* 💰 SaaS monetization
* 🚫 Rate limiting
* 📁 Auto file cleanup (cron job)

---

## ⚠️ Disclaimer

This project is for educational purposes only.
Do not download copyrighted content without permission.

---

## 👨‍💻 Author

**Asif Ali**
Full Stack Developer (MERN + AI)

---

## ⭐ Support

If you like this project:

* ⭐ Star the repo
* 🔁 Share it
* 💡 Contribute

---
