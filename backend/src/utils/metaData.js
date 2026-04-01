import { spawn } from "child_process";

// ✅ Normalize Shorts → Watch URL
const normalizeYouTubeURL = (url) => {
  if (url.includes("shorts")) {
    const id = url.split("shorts/")[1].split("?")[0];
    return `https://www.youtube.com/watch?v=${id}`;
  }
  return url;
};

export const getVideoMetadata = (url) => {
  return new Promise((resolve, reject) => {
    const cleanUrl = normalizeYouTubeURL(url);

    const ytDlp = spawn("yt-dlp", [
      "-j",
      "--no-playlist",
      "--no-warnings",
      "--skip-download",
      cleanUrl,
    ]);

    let data = "";

    ytDlp.stdout.on("data", (chunk) => {
      data += chunk.toString();
    });

    ytDlp.stderr.on("data", (err) => {
      console.log("yt-dlp error:", err.toString());
    });

    ytDlp.on("close", () => {
      try {
        const json = JSON.parse(data);

        resolve({
          title: json.title || "Unknown Title",
          thumbnail: json.thumbnail || "",
          duration: json.duration || 0,
          uploader: json.uploader || "Unknown",
        });
      } catch (err) {
        reject(err);
      }
    });
  });
};