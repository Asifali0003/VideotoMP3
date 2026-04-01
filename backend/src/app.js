import express from "express";
import cors from "cors";
import path from "path";
import conversionRouter from "./routes/conversion.routes.js";

const app = express();

app.use(cors(
    {
        origin: "http://localhost:5173",
        credentials: true,
    }
));
app.use(express.json());

// static downloads
app.use("/downloads", express.static(path.resolve("downloads")));

// routes
app.use("/convert", conversionRouter);

export default app;