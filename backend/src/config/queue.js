import { Queue } from "bullmq";
import IORedis from "ioredis";


const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  tls: {}, // 🔥 required for Upstash
});

export const conversionQueue = new Queue("conversion", {
  connection,
});