import express from "express";
import { convertVideo, getStatus } from "../controllers/convert.controller.js";

const router = express.Router();

// POST /api/convert
router.post("/convert", convertVideo);

// GET /api/convert/:id
router.get("/status/:id", getStatus);

export default router;



