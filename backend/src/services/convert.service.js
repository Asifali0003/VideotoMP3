import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import imagekit from "../config/imagekit.js";
import ConversionModel from "../models/conversion.model.js";
import { getVideoMetadata } from "../utils/metaData.js";

// ✅ Normalize YouTube Shorts URL
const normalizeYouTubeURL = (url) => {
  if (url.includes("shorts")) {
    const id = url.split("shorts/")[1]?.split("?")[0];
    return `https://www.youtube.com/watch?v=${id}`;
  }
  return url;
};

export const processVideo = async (id, url) => {
  try {
    const cleanUrl = normalizeYouTubeURL(url);

    // 🔥 Step 1: Fetch metadata
    let meta = {};
    try {
      meta = await getVideoMetadata(cleanUrl);
    } catch {
      console.log("⚠️ Metadata fetch failed");
    }

    await ConversionModel.findByIdAndUpdate(id, {
      status: "processing",
      title: meta.title || "Unknown Title",
      thumbnail: meta.thumbnail || "",
      duration: meta.duration || 0,
    });

    // ✅ Step 2: Use temp directory (cloud-safe)
    const downloadsDir = path.join(os.tmpdir(), "downloads");
    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir, { recursive: true });
    }

    // ✅ Step 3: yt-dlp (Linux compatible)
    const ytDlpPath = "yt-dlp";
    const outputPath = path.join(downloadsDir, `${id}.%(ext)s`);

    const processDl = spawn(ytDlpPath, [
      "-x",
      "--audio-format", "mp3",
      "--no-playlist",
      "--restrict-filenames",
      "-o", outputPath,
      cleanUrl,
    ]);

    // ⏱ Timeout (5 min)
    const timeout = setTimeout(() => {
      processDl.kill("SIGKILL");
    }, 1000 * 60 * 5);

    // 📊 Logs
    processDl.stdout.on("data", (data) => {
      console.log("yt-dlp:", data.toString());
    });

    processDl.stderr.on("data", (data) => {
      console.log("yt-dlp error:", data.toString());
    });

    // ❌ Process error
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
        const finalPath = path.join(downloadsDir, `${id}.mp3`);

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

        // 🧹 Cleanup
        await fs.promises.unlink(finalPath);

        // ✅ Update DB
        await ConversionModel.findByIdAndUpdate(id, {
          status: "completed",
          fileUrl: response.url,
          fileId: response.fileId,
        });

        console.log("✅ Conversion completed:", id);

      } catch (err) {
        await ConversionModel.findByIdAndUpdate(id, {
          status: "failed",
          error: err.message,
        });

        console.log("❌ Processing error:", err.message);
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