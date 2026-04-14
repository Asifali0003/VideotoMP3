import { Queue } from "bullmq";
import IORedis from "ioredis";

// ✅ Optimized Upstash connection
const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  tls: {},
  enableReadyCheck: false, // 🔥 faster + fewer checks
});

// ✅ Queue with optimized settings
export const conversionQueue = new Queue("conversion", {
  connection,

  defaultJobOptions: {
    removeOnComplete: true, // 🔥 saves Redis memory
    removeOnFail: 50,       // keep only last 50 failures

    attempts: 2, // ❗ reduce retries (was 3)
    backoff: {
      type: "exponential",
      delay: 3000, // 🔥 smaller delay
    },
  },
});

// 🔥 Optional: log queue errors
conversionQueue.on("error", (err) => {
  console.error("🚨 Queue Error:", err.message);
});