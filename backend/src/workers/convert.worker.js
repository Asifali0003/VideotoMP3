import { Worker } from "bullmq";
import IORedis from "ioredis";
import { processVideo } from "../services/convert.service.js";
import connectDB from "../config/database.js";

// ✅ Connect DB first
await connectDB();

// ✅ Upstash Redis connection
const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  tls: {}, // 🔥 required for Upstash
});

const worker = new Worker(
  "conversion", // MUST match queue name
  async (job) => {
    try {
      const { id, url } = job.data;

      if (!id || !url) {
        throw new Error("Invalid job data");
      }

      await processVideo(id, url);

    } catch (err) {
      console.log("❌ Worker processing error:", err.message);
      throw err; // important for retry
    }
  },
  {
    connection,

    // 🔥 Production settings
    concurrency: 2,
    limiter: {
      max: 5,       // max jobs
      duration: 1000, // per second
    },
  }
);

console.log("🚀 Worker started and waiting for jobs...");

// ✅ Events
worker.on("ready", () => {
  console.log("🟢 Worker connected to Redis");
});

worker.on("active", (job) => {
  console.log("🔥 Job started:", job.id);
});

worker.on("completed", (job) => {
  console.log("✅ Job completed:", job.id);
});

worker.on("failed", (job, err) => {
  console.log("❌ Job failed:", job?.id, err.message);
});

worker.on("error", (err) => {
  console.log("🚨 Worker error:", err.message);
});

export default worker;