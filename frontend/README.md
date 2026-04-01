# 🎵 Video to MP3 Converter (Frontend)

A modern, responsive frontend application that converts video URLs into downloadable MP3 audio files. Built with a clean architecture using React, Context API, custom hooks, and TailwindCSS.

---

## 🚀 Features

### ✅ Core Features

* 🎬 Video thumbnail preview
* 📝 Video title display
* 🎧 MP3 download (auto + forced download)
* ⏳ Real-time conversion status
* 📊 Progress bar for better UX

### 🎯 Enhanced UI/UX

* Clean and responsive UI (TailwindCSS)
* Duration badge with auto formatting (sec / min / hour)
* Convert button disabled during processing
* 🎧 Download button enabled only after completion
* ✅ Success message after download
* 🔄 Auto reset after conversion
* ❌ Error handling with user-friendly messages

---

## 🧱 Architecture (4-Layer Design)

This project follows a scalable frontend architecture:

```
UI (Dashboard)
   ↓
Context (State Management)
   ↓
Hook (Business Logic)
   ↓
API Layer (Axios Calls)
```

---

## 📦 Layers Explained

### 1. API Layer (`/service`)

* Handles HTTP requests using Axios
* Functions:

  * `convertAudio(url)`
  * `getConversionStatus(id)`

---

### 2. Hook Layer (`/hooks`)

* Contains business logic
* Handles:

  * API calls
  * Polling mechanism
  * Progress updates
  * Error handling

---

### 3. Context Layer (`/context`)

* Global state management using React Context
* Stores:

  * URL
  * Loading state
  * Data (thumbnail, title, audio)
  * Error
  * Progress

---

### 4. UI Layer (`/feature/download`)

* Dashboard component
* Handles:

  * User input
  * Convert action
  * UI rendering (thumbnail, title, download button)

---

## ⚙️ Tech Stack

* ⚛️ React (Vite)
* 🎨 TailwindCSS
* 🌐 Axios
* 🧠 Context API
* 🔁 Polling (setInterval)

---

## 🔄 Conversion Flow

1. User pastes video URL
2. Clicks **Convert**
3. API request is sent
4. Backend returns job ID
5. Frontend polls status periodically
6. UI updates:

   * Shows thumbnail + title instantly
   * Displays progress bar
   * Enables download button after completion

---

## 🧪 UX Flow

```
Paste URL → Click Convert → Preview → Progress → Download MP3 🎧
```

---

## ⚠️ Important Notes

* Download is only enabled when:

  ```
  status === "completed"
  ```
* Prevents broken or incomplete downloads
* Ensures better UX and reliability

---

## 📁 Project Structure

```
src/
 ├── service/
 │    └── convert.api.js
 ├── hooks/
 │    └── useConvert.js
 ├── context/
 │    └── ConvertContext.jsx
 └── feature/
      └── download/
           └── Dashboard.jsx
```

---

## 🛠️ Setup Instructions

```bash
# Clone repository
git clone <your-repo-url>

# Install dependencies
npm install

# Start development server
npm run dev
```

---

## 🌍 Environment

Make sure your backend is running at:

```
http://localhost:5000/api
```

---

## 🔥 Future Improvements

* 📜 Download history
* 📋 Copy/share download link
* 🌙 Dark/Light mode toggle
* 💀 Skeleton loading UI
* 📱 Mobile-first optimization
* 🔔 Notification system

---

## 💼 Portfolio Value

This project demonstrates:

* Clean scalable architecture (4-layer design)
* Async job handling using polling
* Real-world UX patterns
* Production-level frontend practices

---

## 🙌 Author

**Asif Ali**
Full Stack Developer (MERN + AI)

---

## ⭐ Support

If you like this project, give it a ⭐ on GitHub and share it 🚀

---
