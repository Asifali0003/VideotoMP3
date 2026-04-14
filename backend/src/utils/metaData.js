import { spawn, execSync } from "child_process";

// ======================
// 🔗 Normalize URL
// ======================
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
      console.log("🔥 METADATA SERVICE START");

      const cleanUrl = normalizeYouTubeURL(url);

      // ======================
      // 🔥 SAFE BINARY PATH
      // ======================
      const ytDlpPath = execSync("which yt-dlp").toString().trim();
      console.log("🔍 yt-dlp path:", ytDlpPath);

      const ytDlp = spawn(ytDlpPath, [
        "-j",
        "--no-playlist",
        "--no-warnings",
        "--skip-download",
        cleanUrl,
      ]);

      let data = "";
      let errorData = "";

      // ======================
      // ⏱ Timeout (balanced)
      // ======================
      const timeout = setTimeout(() => {
        ytDlp.kill("SIGKILL");
        console.error("⏱ Metadata timeout");
        reject(new Error("Metadata timeout"));
      }, 15000); // ✅ better than 5s/10s

      // ======================
      // 📥 Collect output
      // ======================
      ytDlp.stdout.on("data", (chunk) => {
        data += chunk.toString();
      });

      ytDlp.stderr.on("data", (chunk) => {
        errorData += chunk.toString();
      });

      // ======================
      // ❌ Spawn error
      // ======================
      ytDlp.on("error", (err) => {
        clearTimeout(timeout);
        console.error("❌ Spawn error (metadata):", err.message);
        reject(err);
      });

      // ======================
      // ✅ Process complete
      // ======================
      ytDlp.on("close", (code) => {
        clearTimeout(timeout);

        if (code !== 0) {
          console.error("❌ yt-dlp metadata failed:", errorData);
          return reject(new Error(errorData || "Metadata failed"));
        }

        try {
          const json = JSON.parse(data);

          const result = {
            title: json.title || "Unknown Title",
            thumbnail: json.thumbnail || "",
            duration: json.duration || 0,
            uploader: json.uploader || "Unknown",
          };

          console.log("✅ Metadata fetched:", result.title);

          resolve(result);

        } catch (err) {
          console.error("❌ JSON parse error:", err.message);
          reject(new Error("Invalid metadata JSON"));
        }
      });

    } catch (err) {
      console.error("🔥 METADATA FATAL ERROR:", err.message);
      reject(err);
    }
  });
};