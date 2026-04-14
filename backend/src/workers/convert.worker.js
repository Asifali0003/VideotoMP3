import { Worker } from "bullmq";
import IORedis from "ioredis";
import { processVideo } from "../services/convert.service.js";
import connectDB from "../config/database.js";

// ======================
// 🔥 GLOBAL ERROR HANDLING (IMPORTANT)
// ======================
process.on("uncaughtException", (err) => {
  console.error("🔥 UNCAUGHT EXCEPTION:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("🔥 UNHANDLED REJECTION:", err);
});

// ======================
// ✅ ENV VALIDATION
// ======================
if (!process.env.REDIS_URL) {
  throw new Error("❌ REDIS_URL is missing in environment variables");
}

// ======================
// ✅ CONNECT DB
// ======================
await connectDB();

// ======================
// 🔗 REDIS CONNECTION
// ======================
console.log("🔗 REDIS URL:", process.env.REDIS_URL);

const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,

  // ✅ Only enable TLS if needed (Upstash)
  tls: process.env.REDIS_URL.startsWith("rediss://") ? {} : undefined,
});

// ======================
// 🚀 WORKER SETUP
// ======================
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

    // ======================
    // 🔥 FREE TIER OPTIMIZATION
    // ======================
    concurrency: 1, // reduce load

    limiter: {
      max: 2,        // max 2 jobs/sec
      duration: 1000,
    },

    settings: {
      stalledInterval: 30000,
      maxStalledCount: 1,
    },
  }
);

console.log("🚀 Worker started and waiting for jobs...");

// ======================
// ✅ EVENTS
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

// 🔥 FULL ERROR LOG
worker.on("error", (err) => {
  console.error("🚨 FULL WORKER ERROR:", err);

  if (err.message?.includes("max requests limit exceeded")) {
    console.log("⚠️ Upstash limit reached — slow down jobs");
  }
});

// ======================
// 🛑 GRACEFUL SHUTDOWN
// ======================
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