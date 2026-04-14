import { Queue } from "bullmq";
import IORedis from "ioredis";

// ======================
// ✅ ENV VALIDATION
// ======================
if (!process.env.REDIS_URL) {
  throw new Error("❌ REDIS_URL is missing in environment variables");
}

// ======================
// 🔗 REDIS CONNECTION (SAFE)
// ======================
console.log("🔗 QUEUE REDIS:", process.env.REDIS_URL);

const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,

  // ✅ FIX: only enable TLS when needed
  tls: process.env.REDIS_URL.startsWith("rediss://") ? {} : undefined,
});

// ======================
// 🚀 QUEUE SETUP
// ======================
export const conversionQueue = new Queue("conversion", {
  connection,

  defaultJobOptions: {
    removeOnComplete: true,   // ✅ save Redis memory
    removeOnFail: 50,         // keep only last failures

    attempts: 2,              // ✅ reduce retries (free tier friendly)

    backoff: {
      type: "exponential",
      delay: 3000,
    },
  },
});

// ======================
// ⚠️ ERROR HANDLING
// ======================
conversionQueue.on("error", (err) => {
  console.error("🚨 QUEUE ERROR:", err);
});