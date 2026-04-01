import { Worker } from "bullmq";
import { processVideo } from "../services/convert.service.js";
import connectDB from "../config/database.js";

// ✅ Ensure DB connection before worker starts
await connectDB();

const worker = new Worker(
  "conversion", // ⚠️ MUST MATCH QUEUE NAME
  async (job) => {
    try {
      const { id, url } = job.data;

      if (!id || !url) {
        throw new Error("Invalid job data");
      }

      await processVideo(id, url);
    } catch (err) {
      console.log("❌ Worker processing error:", err.message);
      throw err; // 🔥 Important: lets BullMQ mark job as failed
    }
  },
  {
    connection: {
      host: "127.0.0.1",
      port: 6379,
    },

    // 🔥 PRO SETTINGS (important)
    concurrency: 2, // process 2 jobs at same time
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

// 🔥 Optional but VERY useful
worker.on("error", (err) => {
  console.log("🚨 Worker error:", err.message);
});

export default worker;