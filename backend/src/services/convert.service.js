import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import imagekit from "../config/imagekit.js";
import ConversionModel from "../models/conversion.model.js";
import { getVideoMetadata } from "../utils/metaData.js";

// Normalize Shorts URL
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

  try {
    // ✅ Ensure temp dir exists
    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir, { recursive: true });
    }

    // 🔥 Step 1: Metadata (non-blocking)
    let meta = {};
    try {
      meta = await getVideoMetadata(cleanUrl);
    } catch {
      console.log("⚠️ Metadata skipped");
    }

    await ConversionModel.findByIdAndUpdate(id, {
      status: "processing",
      title: meta.title || "Unknown Title",
      thumbnail: meta.thumbnail || null, // ✅ FIXED
      duration: meta.duration || 0,
    });

    // 🔥 Step 2: Setup paths
    const outputTemplate = path.join(downloadsDir, `${id}.%(ext)s`);
    const finalPath = path.join(downloadsDir, `${id}.mp3`);

    // ✅ Use local binaries (Render compatible)
    const ytDlpPath = "./yt-dlp";
    const ffmpegPath = "./ffmpeg";

    // 🔥 Step 3: Spawn yt-dlp
    const processDl = spawn(ytDlpPath, [
      "-x",
      "--audio-format", "mp3",
      "--audio-quality", "0",
      "--no-playlist",
      "--restrict-filenames",

      // ✅ Improve reliability
      "--force-ipv4",
      "--no-check-certificates",

      // ✅ Use local ffmpeg
      "--ffmpeg-location", ffmpegPath,

      "-o", outputTemplate,
      cleanUrl,
    ]);

    // ⏱ Timeout (5 min)
    const timeout = setTimeout(() => {
      processDl.kill("SIGKILL");
    }, 1000 * 60 * 5);

    // 📊 Logs (useful for debugging & progress)
    processDl.stdout.on("data", (data) => {
      console.log("yt-dlp:", data.toString());
    });

    processDl.stderr.on("data", (data) => {
      console.log("yt-dlp error:", data.toString());
    });

    // ❌ Spawn error
    processDl.on("error", async (err) => {
      clearTimeout(timeout);

      await ConversionModel.findByIdAndUpdate(id, {
        status: "failed",
        error: err.message,
      });

      console.log("❌ Spawn error:", err.message);
    });

    // ✅ Process complete
    processDl.on("close", async (code) => {
      clearTimeout(timeout);

      if (code !== 0) {
        await ConversionModel.findByIdAndUpdate(id, {
          status: "failed",
          error: "yt-dlp failed",
        });
        return;
      }

      try {
        // ✅ Ensure file exists
        if (!fs.existsSync(finalPath)) {
          throw new Error("MP3 file not found");
        }

        const fileBuffer = await fs.promises.readFile(finalPath);

        // ☁️ Upload to ImageKit
        const response = await imagekit.upload({
          file: fileBuffer,
          fileName: `${id}.mp3`,
          folder: "/audio-files",
        });

        // 🧹 Cleanup (VERY IMPORTANT)
        await fs.promises.unlink(finalPath);

        // ✅ Update DB
        await ConversionModel.findByIdAndUpdate(id, {
          status: "completed",
          fileUrl: response.url,
          fileId: response.fileId,
        });

        console.log("✅ Conversion completed:", id);

      } catch (err) {
        // ❌ Handle processing error
        await ConversionModel.findByIdAndUpdate(id, {
          status: "failed",
          error: err.message,
        });

        console.log("❌ Processing error:", err.message);

        // 🧹 Cleanup if file exists
        if (fs.existsSync(finalPath)) {
          await fs.promises.unlink(finalPath);
        }
      }
    });

  } catch (err) {
    console.log("❌ PROCESS ERROR:", err.message);

    await ConversionModel.findByIdAndUpdate(id, {
      status: "failed",
      error: err.message,
    });
  }
};