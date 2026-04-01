import express from "express";
import { convertVideo, getStatus } from "../controllers/convert.controller.js";

const router = express.Router();

router.post("/", convertVideo);
router.get("/:id", getStatus);

export default router;