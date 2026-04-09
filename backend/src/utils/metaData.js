import { spawn } from "child_process";

// ✅ Normalize Shorts → Watch URL
const normalizeYouTubeURL = (url) => {
  if (url.includes("shorts")) {
    const id = url.split("shorts/")[1]?.split("?")[0];
    return `https://www.youtube.com/watch?v=${id}`;
  }
  return url;
};

export const getVideoMetadata = (url) => {
  return new Promise((resolve, reject) => {
    try {
      const cleanUrl = normalizeYouTubeURL(url);

      // ✅ Linux compatible (no .exe)
      const ytDlp = spawn("yt-dlp", [
        "-j",
        "--no-playlist",
        "--no-warnings",
        "--skip-download",
        cleanUrl,
      ]);

      let data = "";
      let errorData = "";

      // 📥 Collect stdout
      ytDlp.stdout.on("data", (chunk) => {
        data += chunk.toString();
      });

      // ⚠️ Collect stderr (important for debugging)
      ytDlp.stderr.on("data", (chunk) => {
        errorData += chunk.toString();
      });

      // ❌ Process error (very important)
      ytDlp.on("error", (err) => {
        console.log("❌ Spawn error:", err.message);
        reject(err);
      });

      // ⏱ Timeout (avoid hanging)
      const timeout = setTimeout(() => {
        ytDlp.kill("SIGKILL");
        reject(new Error("Metadata fetch timeout"));
      }, 1000 * 30); // 30 sec

      // ✅ Process close
      ytDlp.on("close", (code) => {
        clearTimeout(timeout);

        if (code !== 0) {
          console.log("❌ yt-dlp failed:", errorData);
          return reject(new Error("yt-dlp metadata failed"));
        }

        try {
          const json = JSON.parse(data);

          resolve({
            title: json.title || "Unknown Title",
            thumbnail: json.thumbnail || "",
            duration: json.duration || 0,
            uploader: json.uploader || "Unknown",
          });

        } catch (err) {
          console.log("❌ JSON parse error:", err.message);
          reject(new Error("Invalid metadata response"));
        }
      });

    } catch (err) {
      console.log("❌ METADATA ERROR:", err.message);
      reject(err);
    }
  });
};