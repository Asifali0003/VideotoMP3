import { spawn } from "child_process";

const normalizeYouTubeURL = (url) => {
  if (url.includes("shorts")) {
    const id = url.split("shorts/")[1]?.split("?")[0];
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
    let errorData = "";

    const timeout = setTimeout(() => {
      ytDlp.kill("SIGKILL");
      reject(new Error("Metadata timeout"));
    }, 10000); // 🔥 reduced

    ytDlp.stdout.on("data", (chunk) => {
      data += chunk.toString();
    });

    ytDlp.stderr.on("data", (chunk) => {
      errorData += chunk.toString();
    });

    ytDlp.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    ytDlp.on("close", (code) => {
      clearTimeout(timeout);

      if (code !== 0) {
        console.error("❌ Metadata error:", errorData);
        return reject(new Error("Metadata failed"));
      }

      try {
        const json = JSON.parse(data);

        resolve({
          title: json.title || "Unknown Title",
          thumbnail: json.thumbnail || "",
          duration: json.duration || 0,
          uploader: json.uploader || "Unknown",
        });

      } catch {
        reject(new Error("Invalid metadata JSON"));
      }
    });
  });
};