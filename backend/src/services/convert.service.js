import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import imagekit from "../config/imagekit.js";
import ConversionModel from "../models/conversion.model.js";
import { getVideoMetadata } from "../utils/metaData.js";

const normalizeYouTubeURL = (url) => {
  if (url.includes("shorts")) {
    const id = url.split("shorts/")[1]?.split("?")[0];
    return `https://www.youtube.com/watch?v=${id}`;
  }
  return url;
};

export const processVideo = async (id, url) => {
  const downloadsDir = path.join(os.tmpdir(), "downloads");
  const cleanUrl = normalizeYouTubeURL(url);

  const ytDlpPath = "yt-dlp";     // ✅ FIXED
  const ffmpegPath = "ffmpeg";   // ✅ FIXED

  let finalPath = path.join(downloadsDir, `${id}.mp3`);

  try {
    console.log(`🚀 Processing job ${id}`);

    // ✅ Ensure temp dir
    await fs.promises.mkdir(downloadsDir, { recursive: true });

    // 🔥 Metadata (fast + safe)
    let meta = {};
    try {
      meta = await Promise.race([
        getVideoMetadata(cleanUrl),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("meta timeout")), 5000)
        ),
      ]);
    } catch {
      console.log("⚠️ Metadata skipped");
    }

    await ConversionModel.findByIdAndUpdate(id, {
      status: "processing",
      title: meta.title || "Unknown Title",
      thumbnail: meta.thumbnail || null,
      duration: meta.duration || 0,
    });

    const outputTemplate = path.join(downloadsDir, `${id}.%(ext)s`);

    // 🔥 Spawn yt-dlp safely
    const processDl = spawn(ytDlpPath, [
      "-x",
      "--audio-format", "mp3",
      "--audio-quality", "0",
      "--no-playlist",
      "--restrict-filenames",
      "--force-ipv4",
      "--no-check-certificates",
      "--ffmpeg-location", ffmpegPath,
      "-o", outputTemplate,
      cleanUrl,
    ]);

    let errorOutput = "";

    // ⏱ Timeout (reduced)
    const timeout = setTimeout(() => {
      processDl.kill("SIGKILL");
    }, 1000 * 60 * 3); // 3 min

    processDl.stdout.on("data", (data) => {
      console.log(`📊 ${id}:`, data.toString());
    });

    processDl.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    // ❌ Spawn fail (binary missing etc.)
    processDl.on("error", async (err) => {
      clearTimeout(timeout);

      console.error("❌ Spawn error:", err.message);

      await ConversionModel.findByIdAndUpdate(id, {
        status: "failed",
        error: "yt-dlp not found or failed",
      });
    });

    // ✅ Wrap in promise (VERY IMPORTANT FIX)
    await new Promise((resolve, reject) => {
      processDl.on("close", async (code) => {
        clearTimeout(timeout);

        if (code !== 0) {
          console.error("❌ yt-dlp failed:", errorOutput);

          await ConversionModel.findByIdAndUpdate(id, {
            status: "failed",
            error: "yt-dlp failed",
          });

          return reject(new Error("yt-dlp failed"));
        }

        try {
          // ✅ Ensure file exists
          if (!fs.existsSync(finalPath)) {
            throw new Error("MP3 file not found");
          }

          const fileBuffer = await fs.promises.readFile(finalPath);

          // ☁️ Upload
          const response = await imagekit.upload({
            file: fileBuffer,
            fileName: `${id}.mp3`,
            folder: "/audio-files",
          });

          // 🧹 Cleanup
          await fs.promises.unlink(finalPath);

          await ConversionModel.findByIdAndUpdate(id, {
            status: "completed",
            fileUrl: response.url,
            fileId: response.fileId,
          });

          console.log(`✅ Completed job ${id}`);
          resolve();

        } catch (err) {
          console.error("❌ Processing error:", err.message);

          await ConversionModel.findByIdAndUpdate(id, {
            status: "failed",
            error: err.message,
          });

          if (fs.existsSync(finalPath)) {
            await fs.promises.unlink(finalPath);
          }

          reject(err);
        }
      });
    });

  } catch (err) {
    console.error("🔥 PROCESS ERROR:", err.message);

    await ConversionModel.findByIdAndUpdate(id, {
      status: "failed",
      error: err.message,
    });
  }
};