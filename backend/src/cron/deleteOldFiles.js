import cron from "node-cron";
import imagekit from "../config/imagekit.js";
import ConversionModel from "../models/conversion.model.js";

// Runs every hour
cron.schedule("0 * * * *", async () => {
  console.log("🧹 Running cleanup job...");

  try {
    const now = new Date();
    const past24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const oldFiles = await ConversionModel.find({
      createdAt: { $lt: past24h },
      fileId: { $exists: true },
    });

    for (const file of oldFiles) {
      try {
        await imagekit.deleteFile(file.fileId);

        await ConversionModel.findByIdAndUpdate(file._id, {
          status: "deleted",
        });

        console.log("🗑️ Deleted:", file._id);
      } catch (err) {
        console.log("Delete error:", err.message);
      }
    }
  } catch (err) {
    console.log("Cron error:", err.message);
  }
});