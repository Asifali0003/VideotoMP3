import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import imagekit from "../config/imagekit.js";
import ConversionModel from "../models/conversion.model.js";
import { getVideoMetadata } from "../utils/metaData.js";

// ✅ Normalize Shorts
const normalizeYouTubeURL = (url) => {
  if (url.includes("shorts")) {
    const id = url.split("shorts/")[1].split("?")[0];
    return `https://www.youtube.com/watch?v=${id}`;
  }
  return url;
};

export const processVideo = async (id, url) => {
  return new Promise(async (resolve, reject) => {
    try {
      const cleanUrl = normalizeYouTubeURL(url);

      // 🔥 Fetch metadata in worker (reliable)
      let meta = {};
      try {
        meta = await getVideoMetadata(cleanUrl);
      } catch {
        console.log("Metadata fetch failed in worker");
      }

      await ConversionModel.findByIdAndUpdate(id, {
        status: "processing",
        title: meta.title || "Unknown Title",
        thumbnail: meta.thumbnail || "",
        duration: meta.duration || 0,
      });

      const downloadsDir = path.join(process.cwd(), "downloads");

      if (!fs.existsSync(downloadsDir)) {
        fs.mkdirSync(downloadsDir);
      }

      const ytDlpPath = path.join(process.cwd(), "yt-dlp.exe");

      const processDl = spawn(ytDlpPath, [
        "-x",
        "--audio-format", "mp3",
        "--no-playlist",
        "--restrict-filenames",
        "-o", `${downloadsDir}/${id}.%(ext)s`,
        cleanUrl,
      ]);

      // ⏱ Timeout (5 min)
      const timeout = setTimeout(() => {
        processDl.kill("SIGKILL");
      }, 1000 * 60 * 5);

      processDl.stdout.on("data", (data) => {
        console.log("yt-dlp:", data.toString());
      });

      processDl.stderr.on("data", (data) => {
        console.log("yt-dlp error:", data.toString());
      });

      processDl.on("close", async (code) => {
        clearTimeout(timeout);

        if (code !== 0) {
          await ConversionModel.findByIdAndUpdate(id, {
            status: "failed",
            error: "yt-dlp failed",
          });
          return reject(new Error("yt-dlp failed"));
        }

        try {
          const files = fs.readdirSync(downloadsDir);
          const mp3File = files.find((file) => file.startsWith(id));

          if (!mp3File) throw new Error("MP3 file not found");

          const finalPath = path.join(downloadsDir, mp3File);

          const fileBuffer = await fs.promises.readFile(finalPath);

          const response = await imagekit.upload({
            file: fileBuffer,
            fileName: `${id}.mp3`,
            folder: "/audio-files",
          });

          await fs.promises.unlink(finalPath);

          await ConversionModel.findByIdAndUpdate(id, {
            status: "completed",
            fileUrl: response.url,
            fileId: response.fileId,
          });

          console.log("✅ Conversion completed:", id);

          resolve();
        } catch (err) {
          await ConversionModel.findByIdAndUpdate(id, {
            status: "failed",
            error: err.message,
          });

          reject(err);
        }
      });

    } catch (err) {
      console.log("PROCESS ERROR:", err.message);
      reject(err);
    }
  });
};