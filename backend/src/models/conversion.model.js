import mongoose from "mongoose";

const conversionSchema = new mongoose.Schema(
  {
    videoUrl: {
      type: String,
      required: [true, "videoUrl is required"],
    },

    title: {
      type: String,
      default: "",
    },

    thumbnail: {
      type: String,
      default: "",
    },

    duration: {
      type: Number,
      default: 0,
    },

    uploader: {
      type: String,
      default: "",
    },

    platform: {
      type: String,
      default: "other",
    },

    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"], // ✅ FIXED
      default: "pending",
    },

    fileUrl: {
      type: String,
      default: "",
    },

    fileId: {
      type: String,
      default: "",
    },

    error: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// ✅ TTL index (correct place)
conversionSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 } // 24h
);

const ConversionModel = mongoose.model("Conversion", conversionSchema);

export default ConversionModel;