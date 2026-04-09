import express from "express";
import cors from "cors";
import path from "path";
import conversionRouter from "./routes/conversion.routes.js";

const app = express();

// ======================
// 🔐 CORS CONFIG
// ======================
app.use(cors({
  origin: "*", // later change to Vercel domain
  methods: ["GET", "POST", "PUT", "DELETE"],
}));

app.use(express.json());

// ======================
// 📦 Static downloads
// ======================
app.use("/downloads", express.static(path.resolve("downloads")));

// ======================
// 🚀 API ROUTES
// ======================
app.use("/api", conversionRouter);

export default app;