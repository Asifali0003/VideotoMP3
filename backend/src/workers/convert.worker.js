import { Worker } from "bullmq";
import IORedis from "ioredis";
import { processVideo } from "../services/convert.service.js";
import connectDB from "../config/database.js";

// ✅ Connect DB
await connectDB();

// ✅ Upstash Redis connection (optimized)
const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  tls: {},
  enableReadyCheck: false, // 🔥 faster connection
});

// ✅ Worker
const worker = new Worker(
  "conversion",
  async (job) => {
    const startTime = Date.now();

    try {
      const { id, url } = job.data;

      if (!id || !url) {
        throw new Error("Invalid job data");
      }

      console.log(`📥 Processing Job: ${job.id}`);

      await processVideo(id, url);

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ Job ${job.id} completed in ${duration}s`);

    } catch (err) {
      console.error(`❌ Job ${job.id} failed:`, err.message);
      throw err; // 🔁 allow retry
    }
  },
  {
    connection,

    // 🔥 FREE-TIER OPTIMIZATION
    concurrency: 1, // ❗ reduce Redis load

    limiter: {
      max: 2,        // ❗ reduce request burst
      duration: 1000,
    },

    // 🔥 Reduce Redis usage
    settings: {
      stalledInterval: 30000, // check less often
      maxStalledCount: 1,
    },
  }
);

console.log("🚀 Worker started and waiting for jobs...");

// ======================
// ✅ EVENTS (Optimized)
// ======================

worker.on("ready", () => {
  console.log("🟢 Worker connected to Redis");
});

worker.on("active", (job) => {
  console.log(`🔥 Started Job: ${job.id}`);
});

worker.on("completed", (job) => {
  console.log(`🎉 Completed Job: ${job.id}`);
});

worker.on("failed", (job, err) => {
  console.error(`❌ Failed Job ${job?.id}:`, err.message);
});

// 🔥 IMPORTANT: Handle Redis errors gracefully
worker.on("error", (err) => {
  console.error("🚨 Worker Redis Error:", err.message);

  if (err.message.includes("max requests limit exceeded")) {
    console.log("⚠️ Upstash limit reached — slowing down worker...");
  }
});

// 🔥 Graceful shutdown (VERY IMPORTANT for Railway)
process.on("SIGINT", async () => {
  console.log("🛑 Shutting down worker...");
  await worker.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("🛑 Terminating worker...");
  await worker.close();
  process.exit(0);
});

export default worker;