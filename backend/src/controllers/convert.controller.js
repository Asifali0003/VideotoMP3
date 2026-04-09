import { conversionQueue } from "../config/queue.js";
import ConversionModel from "../models/conversion.model.js";
import { getVideoMetadata } from "../utils/metaData.js";

// ✅ Normalize Shorts
const normalizeYouTubeURL = (url) => {
  if (url.includes("shorts")) {
    const id = url.split("shorts/")[1]?.split("?")[0];
    return `https://www.youtube.com/watch?v=${id}`;
  }
  return url;
};

// ✅ Basic URL validation
const isValidURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const convertVideo = async (req, res) => {
  try {
    const { url } = req.body;

    // ❌ Validation
    if (!url || !isValidURL(url)) {
      return res.status(400).json({ error: "Valid URL is required" });
    }

    const cleanUrl = normalizeYouTubeURL(url);

    // ✅ Platform detection
    const platform =
      cleanUrl.includes("youtube") || cleanUrl.includes("youtu.be")
        ? "youtube"
        : cleanUrl.includes("instagram")
        ? "instagram"
        : cleanUrl.includes("twitter") || cleanUrl.includes("x.com")
        ? "twitter"
        : "other";

    // ✅ Prevent duplicate processing
    const existing = await ConversionModel.findOne({
      videoUrl: cleanUrl,
      status: "completed",
    });

    if (existing) {
      return res.json({
        status: "completed",
        id: existing._id,
        fileUrl: existing.fileUrl,
      });
    }

    // 🔥 Metadata (non-blocking safe)
    let meta = {};
    try {
      meta = await Promise.race([
        getVideoMetadata(cleanUrl),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), 5000)
        ),
      ]);
    } catch {
      console.log("Metadata skipped (timeout)");
    }

    const job = await ConversionModel.create({
      videoUrl: cleanUrl,
      platform,
      title: meta.title || "",
      thumbnail: meta.thumbnail || "",
      duration: meta.duration || 0,
      uploader: meta.uploader || "",
      status: "pending",
    });

    // ✅ Queue with retry + backoff
    await conversionQueue.add(
      "convert",
      {
        id: job._id.toString(),
        url: cleanUrl,
      },
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: 100,
      }
    );

    return res.json({
      status: "pending",
      id: job._id,
      title: job.title,
      thumbnail: job.thumbnail,
      duration: job.duration,
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
};

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

  } catch {
    res.status(500).json({ error: "Server error" });
  }
};