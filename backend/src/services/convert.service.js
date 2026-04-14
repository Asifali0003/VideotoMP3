import { spawn, execSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import imagekit from "../config/imagekit.js";
import ConversionModel from "../models/conversion.model.js";
import { getVideoMetadata } from "../utils/metaData.js";

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

export const processVideo = async (id, url) => {
  const downloadsDir = path.join(os.tmpdir(), "downloads");
  const cleanUrl = normalizeYouTubeURL(url);

  try {
    console.log(`\n🚀 START JOB: ${id}`);
    console.log(`🔗 URL: ${cleanUrl}`);

    // ======================
    // 🔥 VERIFY BINARIES
    // ======================
    try {
      console.log("🔍 yt-dlp:", execSync("which yt-dlp").toString().trim());
      console.log("🔍 ffmpeg:", execSync("which ffmpeg").toString().trim());
    } catch {
      throw new Error("yt-dlp or ffmpeg not installed");
    }

    // ======================
    // 📁 Ensure temp dir
    // ======================
    await fs.promises.mkdir(downloadsDir, { recursive: true });

    // ======================
    // 🔥 Metadata (safe)
    // ======================
    let meta = {};
    try {
      meta = await Promise.race([
        getVideoMetadata(cleanUrl),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Metadata timeout")), 10000)
        ),
      ]);
    } catch (err) {
      console.log("⚠️ Metadata skipped:", err.message);
    }

    await ConversionModel.findByIdAndUpdate(id, {
      status: "processing",
      title: meta.title || "Unknown Title",
      thumbnail: meta.thumbnail || null,
      duration: meta.duration || 0,
    });

    // ======================
    // 📦 Output path
    // ======================
    const outputTemplate = path.join(downloadsDir, `${id}.%(ext)s`);

    console.log("⬇️ Starting download...");

    // ======================
    // 🔥 yt-dlp PROCESS (FIXED)
    // ======================
    const processDl = spawn("yt-dlp", [
      "-x",
      "--audio-format", "mp3",
      "--audio-quality", "0",
      "--no-playlist",
      "--restrict-filenames",
      "--force-ipv4",
      "--no-check-certificates",

      // 🔥 BYPASS YOUTUBE BLOCK
      "--extractor-args",
      "youtube:player_client=android",

      "-o",
      outputTemplate,
      cleanUrl,
    ]);

    let errorOutput = "";

    processDl.stdout.on("data", (data) => {
      console.log(`📊 ${id}:`, data.toString());
    });

    processDl.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    // ⏱ Timeout
    const timeout = setTimeout(() => {
      processDl.kill("SIGKILL");
      console.error("⏱ Download timeout");
    }, 1000 * 60 * 3);

    // ======================
    // 🔥 WAIT FOR PROCESS
    // ======================
    await new Promise((resolve, reject) => {
      processDl.on("error", async (err) => {
        clearTimeout(timeout);

        console.error("❌ Spawn error:", err.message);

        await ConversionModel.findByIdAndUpdate(id, {
          status: "failed",
          error: err.message,
        });

        reject(err);
      });

      processDl.on("close", async (code) => {
        clearTimeout(timeout);

        console.log(`📦 yt-dlp exited with code: ${code}`);

        if (code !== 0) {
          console.error("❌ yt-dlp failed:", errorOutput);

          await ConversionModel.findByIdAndUpdate(id, {
            status: "failed",
            error: errorOutput || "yt-dlp failed",
          });

          return reject(new Error("yt-dlp failed"));
        }

        try {
          // ======================
          // 🔥 FIND FILE
          // ======================
          const files = await fs.promises.readdir(downloadsDir);
          const audioFile = files.find((f) => f.startsWith(id));

          if (!audioFile) {
            throw new Error("Audio file not found");
          }

          const finalPath = path.join(downloadsDir, audioFile);
          console.log("📁 Found file:", finalPath);

          const fileBuffer = await fs.promises.readFile(finalPath);

          // ======================
          // ☁️ Upload
          // ======================
          console.log("☁️ Uploading...");

          const response = await imagekit.upload({
            file: fileBuffer,
            fileName: `${id}.mp3`,
            folder: "/audio-files",
          });

          console.log("✅ Upload success:", response.url);

          // 🧹 Cleanup
          await fs.promises.unlink(finalPath);

          // ======================
          // ✅ Update DB
          // ======================
          await ConversionModel.findByIdAndUpdate(id, {
            status: "completed",
            fileUrl: response.url,
            fileId: response.fileId,
          });

          console.log(`🎉 JOB COMPLETED: ${id}`);
          resolve();

        } catch (err) {
          console.error("❌ Processing error:", err.message);

          await ConversionModel.findByIdAndUpdate(id, {
            status: "failed",
            error: err.message,
          });

          reject(err);
        }
      });
    });

  } catch (err) {
    console.error("🔥 FINAL ERROR:", err.message);

    await ConversionModel.findByIdAndUpdate(id, {
      status: "failed",
      error: err.message,
    });
  }
};