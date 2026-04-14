import "dotenv/config";
import IORedis from "ioredis";

const redis = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  tls: process.env.REDIS_URL?.startsWith("rediss://") ? {} : undefined,
});

(async () => {
  try {
    console.log("🔗 Connecting to Redis...");

    const res = await redis.ping();

    console.log("✅ Redis Connected:", res);

    process.exit(0);
  } catch (err) {
    console.error("❌ Redis Connection Failed:", err);
    process.exit(1);
  }
})();