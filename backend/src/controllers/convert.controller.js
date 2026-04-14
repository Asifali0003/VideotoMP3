import { conversionQueue } from "../config/queue.js";
import ConversionModel from "../models/conversion.model.js";
import { getVideoMetadata } from "../utils/metaData.js";

// ======================
// 🔧 HELPERS
// ======================

const normalizeYouTubeURL = (url) => {
  if (url.includes("shorts")) {
    const id = url.split("shorts/")[1]?.split("?")[0];
    return `https://www.youtube.com/watch?v=${id}`;
  }
  return url;
};

const isValidURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// ======================
// 🚀 CONTROLLER
// ======================

export const convertVideo = async (req, res) => {
  try {
    console.log("📡 API HIT");

    const { url } = req.body;

    // ❌ Validation
    if (!url || !isValidURL(url)) {
      return res.status(400).json({ error: "Valid URL is required" });
    }

    const cleanUrl = normalizeYouTubeURL(url);

    // ✅ Prevent duplicate processing (IMPORTANT)
    const existing = await ConversionModel.findOne({
      videoUrl: cleanUrl,
      status: { $in: ["pending", "processing", "completed"] },
    });

    if (existing) {
      console.log("♻️ Reusing existing job:", existing._id);

      return res.json({
        status: existing.status,
        id: existing._id,
        fileUrl: existing.fileUrl || null,
      });
    }

    // 🔥 Metadata (timeout safe)
    let meta = {};
    try {
      meta = await Promise.race([
        getVideoMetadata(cleanUrl),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), 4000)
        ),
      ]);
    } catch {
      console.log("⚠️ Metadata skipped");
    }

    // ✅ Create job in DB
    const job = await ConversionModel.create({
      videoUrl: cleanUrl,
      platform: "youtube",
      title: meta.title || "",
      thumbnail: meta.thumbnail || "",
      duration: meta.duration || 0,
      uploader: meta.uploader || "",
      status: "pending",
    });

    console.log("🆕 Job created:", job._id);

    // ✅ Add to queue (SAFE)
    try {
      await conversionQueue.add("convert", {
        id: job._id.toString(),
        url: cleanUrl,
      });
    } catch (queueErr) {
      console.error("🚨 Queue add failed:", queueErr.message);

      await ConversionModel.findByIdAndUpdate(job._id, {
        status: "failed",
        error: "Queue error",
      });

      return res.status(500).json({ error: "Queue failed" });
    }

    return res.json({
      status: "pending",
      id: job._id,
      title: job.title,
      thumbnail: job.thumbnail,
      duration: job.duration,
    });

  } catch (err) {
    console.error("🔥 CONTROLLER ERROR:", err.message);

    return res.status(500).json({
      error: err.message, // 👈 show real error
    });
  }
};

// ======================
// 📊 STATUS API
// ======================

export const getStatus = async (req, res) => {
  try {
    const job = await ConversionModel.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ error: "Not found" });
    }

    return res.json({
      status: job.status,
      fileUrl: job.fileUrl || null,
      error: job.error || null,
    });

  } catch (err) {
    console.error("🔥 STATUS ERROR:", err.message);

    res.status(500).json({ error: err.message });
  }
};